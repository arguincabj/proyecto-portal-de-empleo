import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AdminNavTabs } from '../admin-nav-tabs'
import { BuscadorPerfilesClient, PostulanteBuscadorItem } from './buscador-perfiles-client'
import { UserSearch } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CV_BUCKET = 'curricula'

export default async function BuscadorPerfilesPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 1. Verificar rol municipal
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'municipalidad') {
    redirect('/inicio')
  }

  // 2. Contadores para los tabs de administración
  const [{ count: countOfertas }, { count: countEmpresas }, { count: countPostulantes }] =
    await Promise.all([
      supabaseAdmin
        .from('ofertas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'borrador'),
      supabaseAdmin
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .eq('estado_aprobacion', 'pendiente'),
      supabaseAdmin
        .from('postulaciones')
        .select('*', { count: 'exact', head: true })
        .in('estado', ['recibida', 'en_revision']),
    ])

  // 3. Consultar todos los postulantes con su información completa
  // Se intenta con los campos completos (incluye localidad, direccion, codigo_postal si existen)
  let listaPostulantes: Array<{
    id: string
    usuario_id: string
    dni: string | null
    cv_url: string | null
    localidad?: string | null
    direccion?: string | null
    codigo_postal?: string | null
    estudios?: string | null
    cursos?: string | null
    experiencia?: string | null
    idiomas?: string | null
    habilidades?: string | null
    horarios?: string | null
    estado_laboral?: string | null
    created_at: string
  }> = []

  const { data: postulantesFull, error: errFull } = await supabaseAdmin
    .from('postulantes')
    .select(`
      id,
      usuario_id,
      dni,
      cv_url,
      localidad,
      direccion,
      codigo_postal,
      estudios,
      cursos,
      experiencia,
      idiomas,
      habilidades,
      horarios,
      estado_laboral,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (!errFull && postulantesFull) {
    listaPostulantes = postulantesFull
  } else {
    // Si la migración de domicilio aún no fue ejecutada, consultar sin esas columnas
    const { data: postulantesCompat, error: errCompat } = await supabaseAdmin
      .from('postulantes')
      .select(`
        id,
        usuario_id,
        dni,
        cv_url,
        estudios,
        cursos,
        experiencia,
        idiomas,
        habilidades,
        horarios,
        estado_laboral,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (!errCompat && postulantesCompat) {
      listaPostulantes = postulantesCompat
    } else {
      // Fallback base
      const { data: postulantesMin } = await supabaseAdmin
        .from('postulantes')
        .select('id, usuario_id, dni, cv_url, created_at')
        .order('created_at', { ascending: false })
      listaPostulantes = postulantesMin ?? []
    }
  }

  const usuarioIds = listaPostulantes.map((p) => p.usuario_id).filter(Boolean) as string[]
  const postulanteIds = listaPostulantes.map((p) => p.id)

  // 4. Consultar datos de usuario (nombre, apellido, email, telefono)
  const usuariosMap = new Map<string, { nombre: string; apellido: string; email: string | null; telefono: string | null }>()
  if (usuarioIds.length > 0) {
    const { data: usuariosData } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre, apellido, email, telefono')
      .in('id', usuarioIds)

    if (usuariosData) {
      usuariosData.forEach((u) => {
        usuariosMap.set(u.id, {
          nombre: u.nombre,
          apellido: u.apellido,
          email: u.email ?? null,
          telefono: u.telefono ?? null,
        })
      })
    }
  }

  // 5. Consultar CVs de la tabla curricula
  type CurriculaRow = {
    id: string
    postulante_id: string
    url: string
    nombre: string
    created_at: string
  }
  const curriculaMap = new Map<string, CurriculaRow[]>()
  if (postulanteIds.length > 0) {
    try {
      const { data: curriculaData } = await supabaseAdmin
        .from('curricula')
        .select('id, postulante_id, url, nombre, created_at')
        .in('postulante_id', postulanteIds)
        .order('created_at', { ascending: false })

      if (curriculaData) {
        curriculaData.forEach((c) => {
          const currs = curriculaMap.get(c.postulante_id) || []
          currs.push(c as CurriculaRow)
          curriculaMap.set(c.postulante_id, currs)
        })
      }
    } catch (e) {
      console.error('Error al consultar curricula:', e)
    }
  }

  // 6. Generar Signed URLs para los CVs
  const todosLosCvPaths = new Set<string>()
  curriculaMap.forEach((currs) => {
    currs.forEach((c) => {
      if (c.url && !c.url.startsWith('http')) todosLosCvPaths.add(c.url)
    })
  })
  listaPostulantes.forEach((p) => {
    if (p.cv_url && !p.cv_url.startsWith('http')) todosLosCvPaths.add(p.cv_url)
  })

  const signedUrlsMap: Record<string, string> = {}
  await Promise.all(
    Array.from(todosLosCvPaths).map(async (path) => {
      try {
        const { data } = await supabaseAdmin.storage
          .from(CV_BUCKET)
          .createSignedUrl(path, 3600)
        if (data?.signedUrl) {
          signedUrlsMap[path] = data.signedUrl
        }
      } catch (err) {
        console.error('Error al firmar CV en buscador:', err)
      }
    })
  )

  // 7. Cantidad de postulaciones por candidato
  const postulacionesCountMap = new Map<string, number>()
  if (postulanteIds.length > 0) {
    try {
      const { data: countData } = await supabaseAdmin
        .from('postulaciones')
        .select('postulante_id')
        .in('postulante_id', postulanteIds)

      if (countData) {
        countData.forEach((row) => {
          const curr = postulacionesCountMap.get(row.postulante_id) || 0
          postulacionesCountMap.set(row.postulante_id, curr + 1)
        })
      }
    } catch (e) {
      console.error('Error al contar postulaciones:', e)
    }
  }

  // 8. Modelar la lista consolidada de postulantes para el cliente
  const postulantesParaCliente: PostulanteBuscadorItem[] = listaPostulantes.map((p) => {
    const usuarioInfo = p.usuario_id ? usuariosMap.get(p.usuario_id) ?? null : null
    const curriculaDelPostulante = curriculaMap.get(p.id) || []

    const curriculaFormateadas = curriculaDelPostulante.map((c) => ({
      id: c.id,
      nombre: c.nombre || 'Currículum',
      signedUrl: c.url.startsWith('http') ? c.url : signedUrlsMap[c.url] || null,
      created_at: c.created_at,
    }))

    // Si no tiene curricula en la tabla nueva pero sí en el campo legacy cv_url, agregarlo
    if (curriculaFormateadas.length === 0 && p.cv_url) {
      curriculaFormateadas.push({
        id: 'legacy',
        nombre: 'Currículum Principal',
        signedUrl: p.cv_url.startsWith('http') ? p.cv_url : signedUrlsMap[p.cv_url] || null,
        created_at: p.created_at,
      })
    }

    return {
      id: p.id,
      dni: p.dni,
      cv_url: p.cv_url,
      localidad: p.localidad ?? null,
      direccion: p.direccion ?? null,
      codigo_postal: p.codigo_postal ?? null,
      estudios: p.estudios ?? null,
      cursos: p.cursos ?? null,
      experiencia: p.experiencia ?? null,
      idiomas: p.idiomas ?? null,
      habilidades: p.habilidades ?? null,
      horarios: p.horarios ?? null,
      estado_laboral: p.estado_laboral ?? null,
      created_at: p.created_at,
      usuario: usuarioInfo,
      curricula: curriculaFormateadas,
      totalPostulaciones: postulacionesCountMap.get(p.id) || 0,
    }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <UserSearch className="size-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Buscador de Perfiles de Postulantes
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Explorá y filtrá la base de candidatos registrados por nombre, DNI, habilidades, experiencia y más.
          </p>
        </div>
      </div>

      {/* Navegación por pestañas de Administración */}
      <AdminNavTabs
        tabActivo="buscador"
        pendientesOfertas={countOfertas ?? 0}
        pendientesEmpresas={countEmpresas ?? 0}
        pendientesPostulantes={countPostulantes ?? 0}
      />

      {/* Componente Cliente Interactivo con Buscador y Filtros */}
      <BuscadorPerfilesClient postulantes={postulantesParaCliente} />
    </div>
  )
}
