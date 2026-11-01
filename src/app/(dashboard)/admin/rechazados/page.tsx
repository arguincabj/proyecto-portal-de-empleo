import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AdminNavTabs } from '../admin-nav-tabs'
import { AdminRechazadosClient, PostulanteRechazadoItem } from './admin-rechazados-client'
import { Shield, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CV_BUCKET = 'curricula'

export default async function AdminRechazadosPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 1. Validar rol municipalidad
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido, rol')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'municipalidad') {
    redirect('/inicio')
  }

  // 2. Contadores para los tabs
  const [
    { count: countOfertas },
    { count: countEmpresas },
    { count: countPostulantes },
    { count: countRechazados },
  ] = await Promise.all([
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
    supabaseAdmin
      .from('derivaciones')
      .select('*', { count: 'exact', head: true })
      .eq('estado_empresa', 'rechazado'),
  ])

  // 3. Obtener todas las derivaciones con estado 'rechazado'
  const { data: derivacionesRechazadas, error: dErr } = await supabaseAdmin
    .from('derivaciones')
    .select('id, postulacion_id, nota_empresa, created_at, updated_at')
    .eq('estado_empresa', 'rechazado')
    .order('updated_at', { ascending: false })

  if (dErr) {
    console.error('Error al consultar derivaciones rechazadas:', dErr)
  }

  const derivaciones = derivacionesRechazadas ?? []
  const postulacionIds = Array.from(new Set(derivaciones.map((d) => d.postulacion_id).filter(Boolean)))

  // 4. Obtener postulaciones
  let listaPostulaciones: Array<{
    id: string
    oferta_id: string
    postulante_id: string
    cv_id?: string | null
    created_at: string
  }> = []

  if (postulacionIds.length > 0) {
    const { data: pData } = await supabaseAdmin
      .from('postulaciones')
      .select('id, oferta_id, postulante_id, cv_id, created_at')
      .in('id', postulacionIds)
    listaPostulaciones = pData ?? []
  }

  const postulacionesMap = new Map<string, (typeof listaPostulaciones)[0]>()
  listaPostulaciones.forEach((p) => postulacionesMap.set(p.id, p))

  // 5. Ofertas
  const ofertaIds = Array.from(new Set(listaPostulaciones.map((p) => p.oferta_id).filter(Boolean)))
  const ofertasMap = new Map<string, { id: string; titulo: string; empresa_nombre: string; empresa_id?: string | null }>()
  if (ofertaIds.length > 0) {
    const { data: oData } = await supabaseAdmin
      .from('ofertas')
      .select('id, titulo, empresa_nombre, empresa_id')
      .in('id', ofertaIds)
    ;(oData ?? []).forEach((o) => ofertasMap.set(o.id, o))
  }

  // 6. Postulantes
  const postulanteIds = Array.from(new Set(listaPostulaciones.map((p) => p.postulante_id).filter(Boolean)))
  type PostulanteRecord = {
    id: string
    usuario_id: string
    cv_url: string | null
    dni?: string | null
    localidad?: string | null
    direccion?: string | null
    estudios?: string | null
    cursos?: string | null
    experiencia?: string | null
    habilidades?: string | null
    categorias_laborales?: string[] | null
  }
  const postulantesMap = new Map<string, PostulanteRecord>()
  const postulantesByUserIdMap = new Map<string, PostulanteRecord>()

  if (postulanteIds.length > 0) {
    const { data: postData } = await supabaseAdmin
      .from('postulantes')
      .select('*')
      .in('id', postulanteIds)

    const { data: postDataByUid } = await supabaseAdmin
      .from('postulantes')
      .select('*')
      .in('usuario_id', postulanteIds)

    const todos = [...(postData ?? []), ...(postDataByUid ?? [])] as PostulanteRecord[]
    todos.forEach((p) => {
      postulantesMap.set(p.id, p)
      if (p.usuario_id) postulantesByUserIdMap.set(p.usuario_id, p)
    })
  }

  // 7. Usuarios (nombres, contacto)
  // Incluir tanto los IDs directos como los usuario_id de los postulantes encontrados
  const usuarioIdsDesdPostulantes = Array.from(postulantesMap.values())
    .map((p) => p.usuario_id)
    .filter(Boolean)
  const usuarioIdsDesdPostulantesByUid = Array.from(postulantesByUserIdMap.values())
    .map((p) => p.usuario_id)
    .filter(Boolean)

  const usuarioIds = Array.from(
    new Set([
      ...usuarioIdsDesdPostulantes,
      ...usuarioIdsDesdPostulantesByUid,
      ...postulanteIds, // fallback: a veces postulante_id == usuario_id
    ])
  )

  const usuariosMap = new Map<string, { id: string; nombre: string; apellido: string; email: string | null; telefono: string | null; dni?: string | null }>()
  if (usuarioIds.length > 0) {
    const { data: uData } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre, apellido, email, telefono, dni')
      .in('id', usuarioIds)
    ;(uData ?? []).forEach((u) => usuariosMap.set(u.id, u))
  }

  // 8. CVs
  const { data: curriculaData } = await supabaseAdmin
    .from('curricula')
    .select('id, postulante_id, url, nombre')
    .in('postulante_id', postulanteIds)

  const curriculaById = new Map<string, { id: string; url: string; nombre: string }>()
  const curriculaByPostulante = new Map<string, Array<{ id: string; url: string; nombre: string }>>()
  ;(curriculaData ?? []).forEach((c) => {
    curriculaById.set(c.id, c)
    const arr = curriculaByPostulante.get(c.postulante_id) || []
    arr.push(c)
    curriculaByPostulante.set(c.postulante_id, arr)
  })

  // URLs firmadas para CV
  const allCvUrls: string[] = []
  ;(curriculaData ?? []).forEach((c) => {
    if (c.url && !c.url.startsWith('http')) allCvUrls.push(c.url)
  })
  Array.from(postulantesMap.values()).forEach((p) => {
    if (p.cv_url && !p.cv_url.startsWith('http')) allCvUrls.push(p.cv_url)
  })

  const signedUrlsMap = new Map<string, string>()
  await Promise.all(
    Array.from(new Set(allCvUrls)).map(async (path) => {
      try {
        const { data } = await supabaseAdmin.storage.from(CV_BUCKET).createSignedUrl(path, 60 * 60)
        if (data?.signedUrl) signedUrlsMap.set(path, data.signedUrl)
      } catch {
        // ignora
      }
    })
  )

  // 9. Construir items de la lista
  const rechazados: PostulanteRechazadoItem[] = []

  for (const der of derivaciones) {
    const postu = postulacionesMap.get(der.postulacion_id)
    if (!postu) continue

    const oferta = ofertasMap.get(postu.oferta_id)
    const postulante = postulantesMap.get(postu.postulante_id) || postulantesByUserIdMap.get(postu.postulante_id)

    // Buscar el usuario por múltiples caminos posibles
    const rawUser =
      (postulante?.usuario_id ? usuariosMap.get(postulante.usuario_id) : null) ??
      usuariosMap.get(postu.postulante_id) ??
      null

    let cvSigned: string | null = null
    let cvNombre: string | null = null

    if (postu.cv_id && curriculaById.has(postu.cv_id)) {
      const cv = curriculaById.get(postu.cv_id)!
      cvNombre = cv.nombre
      cvSigned = cv.url.startsWith('http') ? cv.url : signedUrlsMap.get(cv.url) ?? null
    } else if (postulante) {
      const cvList = curriculaByPostulante.get(postulante.id) ?? []
      if (cvList.length > 0) {
        cvNombre = cvList[0].nombre
        cvSigned = cvList[0].url.startsWith('http') ? cvList[0].url : signedUrlsMap.get(cvList[0].url) ?? null
      } else if (postulante.cv_url) {
        cvNombre = postulante.cv_url.split('/').pop()?.replace(/^\d+-/, '') ?? 'Currículum'
        cvSigned = postulante.cv_url.startsWith('http') ? postulante.cv_url : signedUrlsMap.get(postulante.cv_url) ?? null
      }
    }

    rechazados.push({
      id: der.id,
      fechaRechazo: der.updated_at || der.created_at,
      motivoRechazo: der.nota_empresa,
      oferta: {
        id: oferta?.id ?? postu.oferta_id,
        titulo: oferta?.titulo ?? 'Oferta no disponible',
        empresaNombre: oferta?.empresa_nombre ?? 'Empresa no identificada',
        empresaId: oferta?.empresa_id ?? null,
      },
      postulante: {
        id: postulante?.id ?? postu.postulante_id,
        nombre: rawUser?.nombre ?? '(Sin nombre)',
        apellido: rawUser?.apellido ?? '',
        dni: postulante?.dni ?? rawUser?.dni ?? null,
        email: rawUser?.email ?? null,
        telefono: rawUser?.telefono ?? null,
        localidad: postulante?.localidad ?? null,
        direccion: postulante?.direccion ?? null,
        estudios: postulante?.estudios ?? null,
        cursos: postulante?.cursos ?? null,
        experiencia: postulante?.experiencia ?? null,
        habilidades: postulante?.habilidades ?? null,
        categorias_laborales: Array.isArray(postulante?.categorias_laborales) ? postulante.categorias_laborales : [],
      },
      cv_signed_url: cvSigned,
      cv_nombre: cvNombre,
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs tracking-wider uppercase mb-1">
            <Shield className="size-4" />
            <span>Gestión Municipal de Empleo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Postulantes Rechazados
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Revisá los postulantes que fueron derivados a empresas pero han sido rechazados, junto con el motivo informado por la empresa.
          </p>
        </div>

        <Link
          href="/ofertas"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-teal-700 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:border-teal-300 transition-colors shadow-xs self-start sm:self-auto"
        >
          <ExternalLink className="size-4" />
          <span>Ver portal público</span>
        </Link>
      </div>

      {/* Pestañas de Navegación de Administración */}
      <AdminNavTabs
        tabActivo="rechazados"
        pendientesOfertas={countOfertas ?? 0}
        pendientesEmpresas={countEmpresas ?? 0}
        pendientesPostulantes={countPostulantes ?? 0}
        totalRechazados={countRechazados ?? 0}
      />

      {/* Contenido interactivo */}
      <AdminRechazadosClient rechazados={rechazados} />
    </div>
  )
}
