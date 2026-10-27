import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AdminNavTabs } from '../admin-nav-tabs'
import { GestionPostulantesClient, PostulacionItem } from './gestion-postulantes-client'
import { Shield, ExternalLink, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ oferta?: string }>
}

type OfertaRow = {
  id: string
  titulo: string
  empresa_nombre: string
  estado?: string
  created_at?: string
}

type DerivacionRow = {
  id: string
  postulacion_id: string
  nota_municipalidad?: string | null
  estado_empresa?: string | null
  nota_empresa?: string | null
  created_at?: string
}

type PostulanteRow = {
  id: string
  usuario_id?: string
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
}

type UsuarioRow = {
  id: string
  nombre: string
  apellido: string
  telefono?: string | null
  dni?: string | null
  email?: string | null
  localidad?: string | null
  direccion?: string | null
  codigo_postal?: string | null
}

export default async function AdminPostulantesPage({ searchParams }: Props) {
  const { oferta: ofertaFiltroInicial } = await searchParams
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verificar rol de municipalidad
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido, rol')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'municipalidad') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-red-100 shadow-sm text-center">
        <div className="size-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
        <p className="text-sm text-gray-600 mb-6">
          Esta sección está reservada exclusivamente para el personal de administración municipal.
        </p>
        <Link
          href="/ofertas"
          className="inline-block bg-teal-600 text-white font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
        >
          Ir al portal de ofertas
        </Link>
      </div>
    )
  }

  // 1. Contar pendientes para las pestañas de navegación
  const { count: ofertasPendientesCount } = await supabaseAdmin
    .from('ofertas')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  const { count: empresasPendientesCount } = await supabaseAdmin
    .from('empresas')
    .select('id', { count: 'exact', head: true })
    .eq('estado_aprobacion', 'pendiente')

  const { count: postulantesPendientesCount } = await supabaseAdmin
    .from('postulaciones')
    .select('id', { count: 'exact', head: true })
    .in('estado', ['recibida', 'en_revision'])

  // 2. Obtener todas las postulaciones
  const { data: todasPostulaciones, error: errPost } = await supabaseAdmin
    .from('postulaciones')
    .select('id, oferta_id, postulante_id, estado, created_at')
    .order('created_at', { ascending: false })

  if (errPost) {
    console.error('Error al consultar postulaciones:', errPost)
  }

  const listaPostulaciones = todasPostulaciones ?? []

  // Obtener IDs únicos para búsquedas
  const ofertaIds = Array.from(new Set(listaPostulaciones.map((p) => p.oferta_id).filter(Boolean)))
  const postulanteIds = Array.from(new Set(listaPostulaciones.map((p) => p.postulante_id).filter(Boolean)))
  const postulacionIds = listaPostulaciones.map((p) => p.id)

  // 3. Consultar las ofertas involucradas
  const ofertasMap = new Map<string, OfertaRow>()
  if (ofertaIds.length > 0) {
    const { data: ofertasData, error: errOf } = await supabaseAdmin
      .from('ofertas')
      .select('id, titulo, empresa_nombre, estado, created_at')
      .in('id', ofertaIds)

    if (errOf) console.error('Error al consultar ofertas:', errOf)
    ;(ofertasData ?? []).forEach((o) => ofertasMap.set(o.id, o))
  }

  // 4. Consultar derivaciones existentes
  const derivacionesMap = new Map<string, DerivacionRow>()
  if (postulacionIds.length > 0) {
    const { data: derivacionesData, error: errDer } = await supabaseAdmin
      .from('derivaciones')
      .select('id, postulacion_id, nota_municipalidad, estado_empresa, nota_empresa, created_at')
      .in('postulacion_id', postulacionIds)

    if (errDer) console.error('Error al consultar derivaciones:', errDer)
    ;(derivacionesData ?? []).forEach((d) => derivacionesMap.set(d.postulacion_id, d))
  }

  // 5. Consultar los postulantes de forma desacoplada
  const postulantesMap = new Map<string, PostulanteRow>()
  const postulantesByUsuarioIdMap = new Map<string, PostulanteRow>()

  if (postulanteIds.length > 0) {
    // Intentar buscar postulantes por su id o por usuario_id
    const { data: pData, error: pErr } = await supabaseAdmin
      .from('postulantes')
      .select('*')
      .in('id', postulanteIds)

    if (pErr) {
      console.error('Error al consultar postulantes por id:', pErr)
    }

    // Por si alguna postulación guardó el usuario_id en lugar de postulante_id
    const { data: pDataByUserId } = await supabaseAdmin
      .from('postulantes')
      .select('*')
      .in('usuario_id', postulanteIds)

    const allPostulantes = [...(pData ?? []), ...(pDataByUserId ?? [])]
    allPostulantes.forEach((p) => {
      postulantesMap.set(p.id, p)
      if (p.usuario_id) {
        postulantesByUsuarioIdMap.set(p.usuario_id, p)
      }
    })
  }

  // 6. Consultar los usuarios asociados (nombre, apellido, teléfono)
  const usuarioIds = Array.from(
    new Set([
      ...Array.from(postulantesMap.values()).map((p) => p.usuario_id).filter(Boolean),
      ...Array.from(postulantesByUsuarioIdMap.values()).map((p) => p.usuario_id).filter(Boolean),
      ...postulanteIds, // Por si postulante_id era el ID de auth/usuarios
    ])
  )

  const usuariosMap = new Map<string, UsuarioRow>()
  const emailMap = new Map<string, string>()
  const authMetadataMap = new Map<string, Record<string, unknown>>()

  if (usuarioIds.length > 0) {
    const { data: uData, error: uErr } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .in('id', usuarioIds)

    if (uErr) {
      console.error('Error al consultar tabla usuarios:', uErr)
    }
    ;(uData ?? []).forEach((u) => usuariosMap.set(u.id, u))

    // Obtener emails y metadata desde Supabase Auth Admin
    await Promise.all(
      usuarioIds.map(async (uid) => {
        try {
          const { data } = await supabaseAdmin.auth.admin.getUserById(uid)
          if (data?.user) {
            if (data.user.email) {
              emailMap.set(uid, data.user.email)
            }
            if (data.user.user_metadata) {
              authMetadataMap.set(uid, data.user.user_metadata)
            }
          }
        } catch {
          // ignora
        }
      })
    )
  }

  // 7. Generar URLs firmadas de CVs desde storage
  const cvFirmadas: Record<string, string> = {}
  const cvPaths = Array.from(
    new Set(
      Array.from(postulantesMap.values())
        .map((p) => p.cv_url)
        .filter(Boolean) as string[]
    )
  )

  await Promise.all(
    cvPaths.map(async (path) => {
      try {
        if (path.startsWith('http://') || path.startsWith('https://')) {
          cvFirmadas[path] = path
          return
        }

        const cleanPath = path.startsWith('curricula/') ? path.replace('curricula/', '') : path
        const { data } = await supabaseAdmin.storage.from('curricula').createSignedUrl(cleanPath, 3600)
        if (data?.signedUrl) {
          cvFirmadas[path] = data.signedUrl
        } else {
          // Intentar sin modificar
          const { data: d2 } = await supabaseAdmin.storage.from('curricula').createSignedUrl(path, 3600)
          if (d2?.signedUrl) {
            cvFirmadas[path] = d2.signedUrl
          }
        }
      } catch (err) {
        console.error(`Error al firmar CV (${path}):`, err)
      }
    })
  )

  // 8. Unir todos los datos en memoria
  const postulaciones: PostulacionItem[] = listaPostulaciones.map((p) => {
    const of = ofertasMap.get(p.oferta_id)
    const post = postulantesMap.get(p.postulante_id) || postulantesByUsuarioIdMap.get(p.postulante_id)
    const userId = post?.usuario_id || p.postulante_id
    const rawUser = usuariosMap.get(userId)
    const der = derivacionesMap.get(p.id)

    const cvUrl = post?.cv_url
    const cvSigned = cvUrl ? cvFirmadas[cvUrl] ?? (cvUrl.startsWith('http') ? cvUrl : null) : null
    const userEmail = rawUser?.email || emailMap.get(userId) || null
    const userMeta = authMetadataMap.get(userId) || {}

    const metaLocalidad = typeof userMeta.localidad === 'string' ? userMeta.localidad : null
    const metaDireccion = typeof userMeta.direccion === 'string' ? userMeta.direccion : null
    const metaCodigoPostal = typeof userMeta.codigo_postal === 'string' ? userMeta.codigo_postal : null
    const metaDni = typeof userMeta.dni === 'string' ? userMeta.dni : null
    const metaEstadoLaboral = typeof userMeta.estado_laboral === 'string' ? userMeta.estado_laboral : null

    const localidad = post?.localidad || metaLocalidad || rawUser?.localidad || null
    const direccion = post?.direccion || metaDireccion || rawUser?.direccion || null
    const codigoPostal = post?.codigo_postal || metaCodigoPostal || rawUser?.codigo_postal || null

    return {
      id: p.id,
      estado: p.estado,
      created_at: p.created_at,
      oferta: of
        ? {
            id: of.id,
            titulo: of.titulo,
            empresa_nombre: of.empresa_nombre,
            estado: of.estado,
            created_at: of.created_at,
          }
        : null,
      derivacion: der
        ? {
            id: der.id,
            nota_municipalidad: der.nota_municipalidad,
            estado_empresa: der.estado_empresa,
            nota_empresa: der.nota_empresa,
            created_at: der.created_at,
          }
        : null,
      postulante: post || rawUser || userMeta
        ? {
            id: post?.id || p.postulante_id,
            dni: post?.dni || rawUser?.dni || metaDni || null,
            cv_url: post?.cv_url || null,
            localidad,
            direccion,
            codigo_postal: codigoPostal,
            estudios: post?.estudios || null,
            cursos: post?.cursos || null,
            experiencia: post?.experiencia || null,
            idiomas: post?.idiomas || null,
            habilidades: post?.habilidades || null,
            horarios: post?.horarios || null,
            estado_laboral: post?.estado_laboral || metaEstadoLaboral || null,
            usuario: rawUser
              ? {
                  nombre: rawUser.nombre,
                  apellido: rawUser.apellido,
                  email: userEmail,
                  telefono: rawUser.telefono,
                }
              : null,
          }
        : null,
      cv_signed_url: cvSigned,
    }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs tracking-wider uppercase mb-1">
            <Shield className="size-4" />
            <span>Gestión Municipal de Empleo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Gestión de Postulantes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenido, {usuario.nombre} {usuario.apellido}. Revisá las ofertas con candidatos y seleccioná cuáles derivar a las empresas.
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
        tabActivo="postulantes"
        pendientesOfertas={ofertasPendientesCount ?? 0}
        pendientesEmpresas={empresasPendientesCount ?? 0}
        pendientesPostulantes={postulantesPendientesCount ?? 0}
      />

      {/* Contenido Principal de Gestión de Postulantes */}
      <GestionPostulantesClient
        postulaciones={postulaciones}
        ofertaFiltroInicial={ofertaFiltroInicial}
      />
    </div>
  )
}
