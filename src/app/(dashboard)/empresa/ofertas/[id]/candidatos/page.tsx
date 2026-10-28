import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { OfertaCandidatosClient } from './oferta-candidatos-client'
import type { CandidatoDerivado } from './oferta-candidatos-client'

export const dynamic = 'force-dynamic'

const CV_BUCKET = 'curricula'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OfertaCandidatosPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // 1. Validar usuario y rol empresa
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'empresa') {
    redirect('/inicio')
  }

  // 2. Obtener datos de la empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id, razon_social')
    .eq('usuario_id', user.id)
    .single()

  if (!empresa) redirect('/empresa')

  // 3. Obtener la oferta
  const { data: oferta, error: ofErr } = await supabaseAdmin
    .from('ofertas')
    .select('id, titulo, descripcion, estado, created_at, empresa_nombre, empresa_id')
    .eq('id', id)
    .single()

  if (ofErr || !oferta) {
    return notFound()
  }

  // Verificar que la oferta pertenezca a la empresa (por empresa_id o por coincidencia de razon_social)
  const esDuenia =
    (oferta.empresa_id && oferta.empresa_id === empresa.id) ||
    oferta.empresa_nombre.trim().toLowerCase() === empresa.razon_social.trim().toLowerCase()

  if (!esDuenia) {
    return notFound()
  }

  // 4. Obtener las postulaciones de esta oferta
  let listaPostulaciones: Array<{
    id: string
    oferta_id: string
    postulante_id: string
    estado: string
    created_at: string
    cv_id?: string | null
  }> = []

  const { data: postulacionesData, error: postErr } = await supabaseAdmin
    .from('postulaciones')
    .select('id, oferta_id, postulante_id, cv_id, estado, created_at')
    .eq('oferta_id', id)

  if (postErr) {
    console.error('Error al obtener postulaciones con cv_id:', postErr)
    // Fallback sin cv_id si la columna no existe en la base de datos
    const { data: fallbackData, error: fbErr } = await supabaseAdmin
      .from('postulaciones')
      .select('id, oferta_id, postulante_id, estado, created_at')
      .eq('oferta_id', id)

    if (fbErr) {
      console.error('Error al obtener postulaciones fallback:', fbErr)
    }
    listaPostulaciones = fallbackData ?? []
  } else {
    listaPostulaciones = postulacionesData ?? []
  }

  const postulacionIds = listaPostulaciones.map((p) => p.id)

  if (postulacionIds.length === 0) {
    return (
      <OfertaCandidatosClient
        oferta={{
          id: oferta.id,
          titulo: oferta.titulo,
          descripcion: oferta.descripcion,
          estado: oferta.estado,
          created_at: oferta.created_at,
          empresaNombre: oferta.empresa_nombre,
        }}
        candidatos={[]}
      />
    )
  }

  // 5. Obtener derivaciones para estas postulaciones
  const { data: derivacionesData, error: derErr } = await supabaseAdmin
    .from('derivaciones')
    .select('id, postulacion_id, nota_municipalidad, estado_empresa, nota_empresa, created_at')
    .in('postulacion_id', postulacionIds)

  if (derErr) {
    console.error('Error al obtener derivaciones:', derErr)
  }

  const listaDerivaciones = derivacionesData ?? []
  if (listaDerivaciones.length === 0) {
    return (
      <OfertaCandidatosClient
        oferta={{
          id: oferta.id,
          titulo: oferta.titulo,
          descripcion: oferta.descripcion,
          estado: oferta.estado,
          created_at: oferta.created_at,
          empresaNombre: oferta.empresa_nombre,
        }}
        candidatos={[]}
      />
    )
  }

  // Mapa de postulaciones por ID
  const postulacionesMap = new Map<string, (typeof listaPostulaciones)[0]>()
  listaPostulaciones.forEach((p) => postulacionesMap.set(p.id, p))

  // Obtener IDs de postulantes involucrados en las derivaciones
  const postulanteIds = Array.from(
    new Set(
      listaDerivaciones
        .map((d) => postulacionesMap.get(d.postulacion_id)?.postulante_id)
        .filter(Boolean) as string[]
    )
  )

  type PostulanteRecord = {
    id: string
    usuario_id: string
    cv_url: string | null
    dni?: string | null
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

  type UsuarioRecord = {
    id: string
    nombre: string
    apellido: string
    email: string | null
    telefono: string | null
  }

  // 5. Consultar los postulantes de forma idéntica a admin/postulantes
  const postulantesMap = new Map<string, PostulanteRecord>()
  const postulantesByUsuarioIdMap = new Map<string, PostulanteRecord>()

  if (postulanteIds.length > 0) {
    const { data: pData, error: pErr } = await supabaseAdmin
      .from('postulantes')
      .select('*')
      .in('id', postulanteIds)

    if (pErr) console.error('Error al obtener postulantes por id:', pErr)

    const { data: pDataByUserId } = await supabaseAdmin
      .from('postulantes')
      .select('*')
      .in('usuario_id', postulanteIds)

    const allPostulantes = [...(pData ?? []), ...(pDataByUserId ?? [])] as PostulanteRecord[]
    allPostulantes.forEach((p) => {
      postulantesMap.set(p.id, p)
      if (p.usuario_id) {
        postulantesByUsuarioIdMap.set(p.usuario_id, p)
      }
    })
  }

  // Obtener IDs de usuarios
  const usuarioIds = Array.from(
    new Set([
      ...Array.from(postulantesMap.values()).map((p) => p.usuario_id).filter(Boolean),
      ...Array.from(postulantesByUsuarioIdMap.values()).map((p) => p.usuario_id).filter(Boolean),
      ...postulanteIds,
    ])
  )

  // 7. Obtener datos de usuarios y metadata de auth
  const { data: uData, error: uErr } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .in('id', usuarioIds)

  if (uErr) console.error('Error al consultar usuarios:', uErr)

  const usuariosMap = new Map<string, UsuarioRecord & { dni?: string | null; localidad?: string | null; direccion?: string | null; codigo_postal?: string | null }>()
  ;((uData as Array<UsuarioRecord & { dni?: string | null; localidad?: string | null; direccion?: string | null; codigo_postal?: string | null }> | null) ?? []).forEach((u) => usuariosMap.set(u.id, u))

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

  // 8. Obtener CVs de la tabla curricula
  const { data: curriculaData } = await supabaseAdmin
    .from('curricula')
    .select('id, postulante_id, url, nombre')
    .in('postulante_id', postulanteIds)

  const curriculaByPostulante = new Map<string, Array<{ id: string; url: string; nombre: string }>>()
  const curriculaById = new Map<string, { id: string; url: string; nombre: string }>()
  ;(curriculaData ?? []).forEach((c) => {
    curriculaById.set(c.id, c)
    const list = curriculaByPostulante.get(c.postulante_id) ?? []
    list.push(c)
    curriculaByPostulante.set(c.postulante_id, list)
  })

  // 9. Pre-firmar URLs de storage de forma eficiente
  const pathsParaFirmar = new Set<string>()
  ;(curriculaData ?? []).forEach((c) => {
    if (c.url) pathsParaFirmar.add(c.url)
  })
  ;(Array.from(postulantesMap.values())).forEach((p) => {
    if (p.cv_url) pathsParaFirmar.add(p.cv_url)
  })

  const signedUrlsMap = new Map<string, string>()
  await Promise.all(
    Array.from(pathsParaFirmar).map(async (path) => {
      try {
        if (path.startsWith('http://') || path.startsWith('https://')) {
          signedUrlsMap.set(path, path)
          return
        }
        const cleanPath = path.startsWith('curricula/') ? path.replace('curricula/', '') : path
        const { data } = await supabaseAdmin.storage
          .from(CV_BUCKET)
          .createSignedUrl(cleanPath, 3600)
        if (data?.signedUrl) {
          signedUrlsMap.set(path, data.signedUrl)
        }
      } catch (err) {
        console.error('Error firmando url:', err)
      }
    })
  )

  // 10. Construir lista final de candidatos derivados
  const candidatos: CandidatoDerivado[] = []

  for (const derivacion of listaDerivaciones) {
    const postu = postulacionesMap.get(derivacion.postulacion_id)
    if (!postu) continue

    const postulante =
      postulantesMap.get(postu.postulante_id) || postulantesByUsuarioIdMap.get(postu.postulante_id)

    const cvsSigned: Array<{ nombre: string; signedUrl: string }> = []

    // Si la postulación eligió un cv_id concreto
    if (postu.cv_id) {
      const cvItem = curriculaById.get(postu.cv_id)
      if (cvItem && signedUrlsMap.has(cvItem.url)) {
        cvsSigned.push({
          nombre: cvItem.nombre || 'Currículum adjunto',
          signedUrl: signedUrlsMap.get(cvItem.url)!,
        })
      }
    }

    // Si no tiene CV específico, traer los que tenga
    if (cvsSigned.length === 0 && postulante) {
      const cvsDelPostulante = curriculaByPostulante.get(postulante.id) ?? []
      cvsDelPostulante.forEach((c) => {
        if (signedUrlsMap.has(c.url)) {
          cvsSigned.push({
            nombre: c.nombre || 'Currículum',
            signedUrl: signedUrlsMap.get(c.url)!,
          })
        }
      })

      // Fallback a postulantes.cv_url si existiera
      if (cvsSigned.length === 0 && postulante.cv_url && signedUrlsMap.has(postulante.cv_url)) {
        const nombre = postulante.cv_url.split('/').pop()?.replace(/^\d+-/, '') || 'Currículum'
        cvsSigned.push({
          nombre,
          signedUrl: signedUrlsMap.get(postulante.cv_url)!,
        })
      }
    }

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

    const metaEmail = typeof userMeta.email === 'string' ? userMeta.email : null
    const metaTelefono = typeof userMeta.telefono === 'string' ? userMeta.telefono : null
    const metaDni = typeof userMeta.dni === 'string' ? userMeta.dni : null
    const metaLocalidad = typeof userMeta.localidad === 'string' ? userMeta.localidad : null
    const metaDireccion = typeof userMeta.direccion === 'string' ? userMeta.direccion : null
    const metaCodigoPostal = typeof userMeta.codigo_postal === 'string' ? userMeta.codigo_postal : null
    const metaEstadoLaboral = typeof userMeta.estado_laboral === 'string' ? userMeta.estado_laboral : null

    // Si aún no hay nombre, extraer del email antes de @
    const userEmailRaw = rawUser?.email || (userId ? authEmailMap.get(userId) : null) || metaEmail || null
    let fallbackNombre = 'Candidato'
    const fallbackApellido = ''
    if (!rawUser?.nombre && !metaNombre && userEmailRaw) {
      const emailUsername = userEmailRaw.split('@')[0]
      // Si el email tiene formato 'arguinjulian22', ponerlo con mayúscula
      fallbackNombre = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1)
    }

    const resolvedEmail = userEmailRaw
    const resolvedNombre = rawUser?.nombre || metaNombre || fallbackNombre
    const resolvedApellido = rawUser?.apellido || metaApellido || fallbackApellido
    const resolvedTelefono = rawUser?.telefono || metaTelefono || null
    const resolvedDni = postulante?.dni || rawUser?.dni || metaDni || null
    const resolvedLocalidad = postulante?.localidad || rawUser?.localidad || metaLocalidad || null
    const resolvedDireccion = postulante?.direccion || rawUser?.direccion || metaDireccion || null
    const resolvedCodigoPostal = postulante?.codigo_postal || rawUser?.codigo_postal || metaCodigoPostal || null
    const resolvedEstadoLaboral = postulante?.estado_laboral || metaEstadoLaboral || null

    candidatos.push({
      derivacionId: derivacion.id,
      notaMunicipalidad: derivacion.nota_municipalidad ?? null,
      estadoEmpresa: derivacion.estado_empresa ?? 'pendiente',
      notaEmpresa: derivacion.nota_empresa ?? null,
      fechaDerivacion: derivacion.created_at,
      postulante: {
        id: postulante?.id ?? postu.postulante_id,
        nombre: resolvedNombre,
        apellido: resolvedApellido,
        email: resolvedEmail,
        telefono: resolvedTelefono,
        dni: resolvedDni,
        localidad: resolvedLocalidad,
        direccion: resolvedDireccion,
        codigo_postal: resolvedCodigoPostal,
        estudios: postulante?.estudios ?? null,
        cursos: postulante?.cursos ?? null,
        experiencia: postulante?.experiencia ?? null,
        idiomas: postulante?.idiomas ?? null,
        habilidades: postulante?.habilidades ?? null,
        horarios: postulante?.horarios ?? null,
        estado_laboral: resolvedEstadoLaboral,
      },
      cvs: cvsSigned,
    })
  }

  return (
    <OfertaCandidatosClient
      oferta={{
        id: oferta.id,
        titulo: oferta.titulo,
        descripcion: oferta.descripcion,
        estado: oferta.estado,
        created_at: oferta.created_at,
        empresaNombre: oferta.empresa_nombre,
      }}
      candidatos={candidatos}
    />
  )
}
