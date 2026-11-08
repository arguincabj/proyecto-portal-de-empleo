import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shield, ExternalLink } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AdminNavTabs } from '../admin-nav-tabs'
import { AdminRechazadosClient } from './admin-rechazados-client'
import type { PostulanteRechazadoItem } from './admin-rechazados-client'

export const dynamic = 'force-dynamic'

const CV_BUCKET = 'curricula'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminRechazadosPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido, rol')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'municipalidad') {
    redirect('/inicio')
  }

  // Conteos para tabs de navegación superior (idénticos a admin/postulantes)
  const [
    { count: ofertasPendientesCount },
    { count: empresasPendientesCount },
    { count: postulantesPendientesCount },
    { count: totalRechazadosCount },
  ] = await Promise.all([
    supabaseAdmin.from('ofertas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabaseAdmin.from('empresas').select('id', { count: 'exact', head: true }).eq('estado_aprobacion', 'pendiente'),
    supabaseAdmin.from('postulaciones').select('id', { count: 'exact', head: true }).in('estado', ['recibida', 'en_revision']),
    supabaseAdmin.from('derivaciones').select('id', { count: 'exact', head: true }).eq('estado_empresa', 'rechazado'),
  ])


  // Paginación server-side
  const resolvedSearchParams = await searchParams
  const paginaActual = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const porPagina = 20

  const from = (paginaActual - 1) * porPagina
  const to = from + porPagina - 1

  // 1. Obtener todas las derivaciones rechazadas como estaba antes
  const { data: derivacionesData, error: derErr } = await supabaseAdmin
    .from('derivaciones')
    .select('id, postulacion_id, nota_municipalidad, estado_empresa, nota_empresa, created_at, updated_at')
    .eq('estado_empresa', 'rechazado')
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (derErr) {
    console.error('Error al obtener derivaciones rechazadas:', derErr)
  }

  const derivaciones = derivacionesData ?? []

  // 3. Postulaciones vinculadas
  const postulacionIds = Array.from(new Set(derivaciones.map((d) => d.postulacion_id).filter(Boolean)))
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

  // Calcular la cantidad exacta de rechazos que tiene cada postulante en el sistema
  const { data: todasDerivacionesRechazadas } = await supabaseAdmin
    .from('derivaciones')
    .select('postulacion_id')
    .eq('estado_empresa', 'rechazado')

  const postuIdsRechazadas = Array.from(
    new Set((todasDerivacionesRechazadas ?? []).map((d) => d.postulacion_id).filter(Boolean))
  )

  const conteoRechazosPorPostulante: Record<string, number> = {}
  if (postuIdsRechazadas.length > 0) {
    const { data: pList } = await supabaseAdmin
      .from('postulaciones')
      .select('id, postulante_id')
      .in('id', postuIdsRechazadas)

    ;(pList ?? []).forEach((p) => {
      if (p.postulante_id) {
        conteoRechazosPorPostulante[p.postulante_id] =
          (conteoRechazosPorPostulante[p.postulante_id] || 0) + 1
      }
    })
  }

  // 4. Ofertas
  const ofertaIds = Array.from(new Set(listaPostulaciones.map((p) => p.oferta_id).filter(Boolean)))
  const ofertasMap = new Map<string, { id: string; titulo: string; empresa_nombre: string; empresa_id?: string | null }>()
  if (ofertaIds.length > 0) {
    const { data: oData } = await supabaseAdmin
      .from('ofertas')
      .select('id, titulo, empresa_nombre, empresa_id')
      .in('id', ofertaIds)
    ;(oData ?? []).forEach((o) => ofertasMap.set(o.id, o))
  }

  // 5. Postulantes
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

  // 6. Recolectar usuario_ids e información de auth
  const usuarioIds = Array.from(
    new Set([
      ...Array.from(postulantesMap.values()).map((p) => p.usuario_id).filter(Boolean),
      ...Array.from(postulantesByUserIdMap.values()).map((p) => p.usuario_id).filter(Boolean),
      ...postulanteIds,
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

  // Auth metadata y emails de respaldo
  const authEmailMap = new Map<string, string>()
  const authMetadataMap = new Map<string, Record<string, unknown>>()

  await Promise.all(
    usuarioIds.map(async (uid) => {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(uid)
        if (authUser?.user) {
          if (authUser.user.email) authEmailMap.set(uid, authUser.user.email)
          if (authUser.user.user_metadata) authMetadataMap.set(uid, authUser.user.user_metadata)
        }
      } catch {
        // ignora
      }
    })
  )

  // 7. CVs
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
        const cleanPath = path.startsWith('curricula/') ? path.replace('curricula/', '') : path
        const { data } = await supabaseAdmin.storage.from(CV_BUCKET).createSignedUrl(cleanPath, 60 * 60)
        if (data?.signedUrl) signedUrlsMap.set(path, data.signedUrl)
      } catch {
        // ignora
      }
    })
  )

  // 8. Construir items de la lista
  const rechazados: PostulanteRechazadoItem[] = []

  for (const der of derivaciones) {
    const postu = postulacionesMap.get(der.postulacion_id)
    if (!postu) continue

    const oferta = ofertasMap.get(postu.oferta_id)
    const postulante = postulantesMap.get(postu.postulante_id) || postulantesByUserIdMap.get(postu.postulante_id)

    const userId = postulante?.usuario_id || postu.postulante_id
    const userMeta = (userId ? authMetadataMap.get(userId) : null) || {}
    const rawUser = (postulante?.usuario_id ? usuariosMap.get(postulante.usuario_id) : null) || usuariosMap.get(postu.postulante_id)

    const metaNombre =
      (typeof userMeta.nombre === 'string' && userMeta.nombre.trim()) ||
      (typeof userMeta.full_name === 'string' && userMeta.full_name.trim().split(' ')[0]) ||
      (typeof userMeta.name === 'string' && userMeta.name.trim().split(' ')[0]) ||
      null

    const metaApellido =
      (typeof userMeta.apellido === 'string' && userMeta.apellido.trim()) ||
      (typeof userMeta.full_name === 'string' && userMeta.full_name.trim().split(' ').slice(1).join(' ')) ||
      null

    const userEmailRaw = rawUser?.email || (userId ? authEmailMap.get(userId) : null) || (typeof userMeta.email === 'string' ? userMeta.email : null)
    let fallbackNombre = ''
    if (!rawUser?.nombre && !metaNombre && userEmailRaw) {
      const emailUsername = userEmailRaw.split('@')[0]
      fallbackNombre = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1)
    }

    const resolvedNombre = rawUser?.nombre || metaNombre || fallbackNombre || 'Postulante'
    const resolvedApellido = rawUser?.apellido || metaApellido || ''
    const resolvedDni = postulante?.dni ?? rawUser?.dni ?? (typeof userMeta.dni === 'string' ? userMeta.dni : null)
    const resolvedEmail = userEmailRaw
    const resolvedTelefono = rawUser?.telefono ?? (typeof userMeta.telefono === 'string' ? userMeta.telefono : null)

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

    const idPostulante = postulante?.id ?? postu.postulante_id
    const cantidadRechazos = conteoRechazosPorPostulante[idPostulante] || 1
    const tieneTres = cantidadRechazos >= 3

    rechazados.push({
      id: der.id,
      fechaRechazo: der.updated_at || der.created_at,
      motivoRechazo: der.nota_empresa,
      tieneTresRechazos: tieneTres,
      totalRechazados: cantidadRechazos,
      oferta: {
        id: oferta?.id ?? postu.oferta_id,
        titulo: oferta?.titulo ?? 'Oferta no disponible',
        empresaNombre: oferta?.empresa_nombre ?? 'Empresa no identificada',
        empresaId: oferta?.empresa_id ?? null,
      },
      postulante: {
        id: postulante?.id ?? postu.postulante_id,
        nombre: resolvedNombre,
        apellido: resolvedApellido,
        dni: resolvedDni,
        email: resolvedEmail,
        telefono: resolvedTelefono,
        localidad: postulante?.localidad ?? null,
        direccion: postulante?.direccion ?? null,
        estudios: postulante?.estudios ?? null,
        cursos: postulante?.cursos ?? null,
        experiencia: postulante?.experiencia ?? null,
        habilidades: postulante?.habilidades ?? null,
        categorias_laborales: Array.isArray(postulante?.categorias_laborales) ? postulante.categorias_laborales : [],
        totalRechazados: cantidadRechazos,
      },
      cv_signed_url: cvSigned,
      cv_nombre: cvNombre,
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Encabezado idéntico al resto de las pantallas admin */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs tracking-wider uppercase mb-1">
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

      {/* Tabs con contadores de notificaciones */}
      <AdminNavTabs
        tabActivo="rechazados"
        pendientesOfertas={ofertasPendientesCount ?? 0}
        pendientesEmpresas={empresasPendientesCount ?? 0}
        pendientesPostulantes={postulantesPendientesCount ?? 0}
        totalRechazados={totalRechazadosCount ?? 0}
      />

      {/* Listado con filtros */}
      <AdminRechazadosClient
        rechazados={rechazados}
      />
    </div>
  )
}
