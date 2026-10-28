import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CambiarEstadoBoton } from './cambiar-estado-boton'
import { DerivacionesEmpresaClient } from './derivaciones-empresa-client'
import type { DerivacionPostulante } from './derivaciones-empresa-client'

export const dynamic = 'force-dynamic'

const CV_BUCKET = 'curricula'

export default async function EmpresaDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // 1. Obtener usuario y validar rol
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido, rol')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'empresa') {
    redirect('/inicio')
  }

  // 2. Obtener datos de la empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id, razon_social, cuit, rubro, descripcion')
    .eq('usuario_id', user.id)
    .single()

  const razonSocial = (empresa?.razon_social ?? '').trim()
  const empresaId = empresa?.id

  // 3. Obtener ofertas creadas por esta empresa
  // Buscamos tanto por empresa_id (si existe la FK de migration_009) como por razon_social
  let queryOfertas = supabaseAdmin
    .from('ofertas')
    .select(`
      id,
      titulo,
      descripcion,
      estado,
      created_at,
      empresa_nombre
    `)

  if (empresaId) {
    queryOfertas = queryOfertas.or(`empresa_nombre.eq."${razonSocial}",empresa_id.eq.${empresaId}`)
  } else {
    queryOfertas = queryOfertas.ilike('empresa_nombre', razonSocial)
  }

  const { data: ofertasData, error: errOfEmpresa } = await queryOfertas.order('created_at', { ascending: false })

  if (errOfEmpresa) {
    console.error('Error al consultar ofertas de la empresa:', errOfEmpresa)
  }

  // Si no encontró con filtro combinado, fallback a ilike por si hay mayúsculas/minúsculas diferentes
  let ofertas = ofertasData ?? []
  if (ofertas.length === 0 && razonSocial) {
    const { data: fallbackOf } = await supabaseAdmin
      .from('ofertas')
      .select('id, titulo, descripcion, estado, created_at, empresa_nombre')
      .ilike('empresa_nombre', razonSocial)
      .order('created_at', { ascending: false })
    ofertas = fallbackOf ?? []
  }

  // 4. Calcular métricas
  const totalOfertas = ofertas.length
  const ofertasPublicadas = ofertas.filter((o) => o.estado === 'publicada').length

  // 5. Obtener derivaciones de las ofertas de esta empresa de forma robusta
  const ofertaIds = ofertas.map((o) => o.id)
  const derivacionesProcesadas: DerivacionPostulante[] = []

  if (ofertaIds.length > 0) {
    // 5.1 Buscar postulaciones para las ofertas de la empresa
    let listaPostulaciones: Array<{
      id: string
      oferta_id: string
      postulante_id: string
      cv_id?: string | null
    }> = []

    const { data: postulacionesEmpresa, error: postErr } = await supabaseAdmin
      .from('postulaciones')
      .select('id, oferta_id, postulante_id, cv_id')
      .in('oferta_id', ofertaIds)

    if (postErr) {
      console.error('Error al obtener postulaciones con cv_id en empresa dashboard:', postErr)
      const { data: fbPost } = await supabaseAdmin
        .from('postulaciones')
        .select('id, oferta_id, postulante_id')
        .in('oferta_id', ofertaIds)
      listaPostulaciones = fbPost ?? []
    } else {
      listaPostulaciones = postulacionesEmpresa ?? []
    }

    const postulacionIds = listaPostulaciones.map((p) => p.id)

    if (postulacionIds.length > 0) {
      // 5.2 Buscar derivaciones para estas postulaciones
      const { data: derivacionesData } = await supabaseAdmin
        .from('derivaciones')
        .select('id, postulacion_id, nota_municipalidad, estado_empresa, nota_empresa, created_at')
        .in('postulacion_id', postulacionIds)
        .order('created_at', { ascending: false })

      const listaDerivaciones = derivacionesData ?? []

      if (listaDerivaciones.length > 0) {
        // Mapas auxiliares
        const ofertasMap = new Map<string, (typeof ofertas)[0]>()
        ofertas.forEach((o) => ofertasMap.set(o.id, o))

        const postulacionesMap = new Map<string, (typeof listaPostulaciones)[0]>()
        listaPostulaciones.forEach((p) => postulacionesMap.set(p.id, p))

        const postulanteIds = Array.from(
          new Set(
            listaDerivaciones
              .map((d) => postulacionesMap.get(d.postulacion_id)?.postulante_id)
              .filter(Boolean) as string[]
          )
        )

        // 5.3 Obtener postulantes (buscando tanto por postulantes.id como postulantes.usuario_id)
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

        const { data: postulantesData } = await supabaseAdmin
          .from('postulantes')
          .select('*')
          .in('id', postulanteIds)

        const { data: postulantesPorUsuarioId } = await supabaseAdmin
          .from('postulantes')
          .select('*')
          .in('usuario_id', postulanteIds)

        const postulantesMap = new Map<string, PostulanteRecord>()
        const postulantesByUsuarioIdMap = new Map<string, PostulanteRecord>()

        const allPostulantes = [...(postulantesData ?? []), ...(postulantesPorUsuarioId ?? [])] as PostulanteRecord[]
        allPostulantes.forEach((p) => {
          postulantesMap.set(p.id, p)
          if (p.usuario_id) {
            postulantesByUsuarioIdMap.set(p.usuario_id, p)
          }
        })

        // 5.4 Obtener usuarios
        const usuarioIds = Array.from(
          new Set([
            ...Array.from(postulantesMap.values()).map((p) => p.usuario_id).filter(Boolean),
            ...Array.from(postulantesByUsuarioIdMap.values()).map((p) => p.usuario_id).filter(Boolean),
            ...postulanteIds,
          ])
        )

        type UsuarioRecord = {
          id: string
          nombre: string
          apellido: string
          email: string | null
          telefono: string | null
          dni?: string | null
          localidad?: string | null
          direccion?: string | null
          codigo_postal?: string | null
        }

        const { data: usuariosData } = await supabaseAdmin
          .from('usuarios')
          .select('id, nombre, apellido, email, telefono, dni, localidad, direccion, codigo_postal')
          .in('id', usuarioIds)

        const usuariosMap = new Map<string, UsuarioRecord>()
        ;((usuariosData as UsuarioRecord[] | null) ?? []).forEach((u) => usuariosMap.set(u.id, u))

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

        // 5.5 Obtener curricula y preparar firmas de CV
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

        const pathsParaFirmar = new Set<string>()
        ;(curriculaData ?? []).forEach((c) => {
          if (c.url) pathsParaFirmar.add(c.url)
        })
        ;(postulantesData ?? []).forEach((p) => {
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
            } catch {
              // ignore
            }
          })
        )

        // 5.6 Armar las derivaciones procesadas
        for (const derivacion of listaDerivaciones) {
          const postu = postulacionesMap.get(derivacion.postulacion_id)
          if (!postu) continue

          const of = ofertasMap.get(postu.oferta_id)
          const post = postulantesMap.get(postu.postulante_id) || postulantesByUsuarioIdMap.get(postu.postulante_id)

          if (!of) continue

          const cvsSigned: Array<{ nombre: string; signedUrl: string }> = []
          if (postu.cv_id) {
            const cvItem = curriculaById.get(postu.cv_id)
            if (cvItem && signedUrlsMap.has(cvItem.url)) {
              cvsSigned.push({
                nombre: cvItem.nombre || 'Currículum adjunto',
                signedUrl: signedUrlsMap.get(cvItem.url)!,
              })
            }
          }

          if (cvsSigned.length === 0 && post) {
            const cvsPost = curriculaByPostulante.get(post.id) ?? []
            cvsPost.forEach((c) => {
              if (signedUrlsMap.has(c.url)) {
                cvsSigned.push({
                  nombre: c.nombre || 'Currículum',
                  signedUrl: signedUrlsMap.get(c.url)!,
                })
              }
            })
            if (cvsSigned.length === 0 && post.cv_url && signedUrlsMap.has(post.cv_url)) {
              const nombre = post.cv_url.split('/').pop()?.replace(/^\d+-/, '') || 'Currículum'
              cvsSigned.push({
                nombre,
                signedUrl: signedUrlsMap.get(post.cv_url)!,
              })
            }
          }

          const userId = post?.usuario_id || postu.postulante_id
          const userMeta = (userId ? authMetadataMap.get(userId) : null) || {}

          const rawUser = (post?.usuario_id ? usuariosMap.get(post.usuario_id) : null) || usuariosMap.get(postu.postulante_id)

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

          const userEmailRaw = rawUser?.email || (userId ? authEmailMap.get(userId) : null) || metaEmail || null
          let fallbackNombre = 'Candidato'
          const fallbackApellido = ''
          if (!rawUser?.nombre && !metaNombre && userEmailRaw) {
            const emailUsername = userEmailRaw.split('@')[0]
            fallbackNombre = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1)
          }

          const resolvedEmail = userEmailRaw
          const resolvedNombre = rawUser?.nombre || metaNombre || fallbackNombre
          const resolvedApellido = rawUser?.apellido || metaApellido || fallbackApellido
          const resolvedTelefono = rawUser?.telefono || metaTelefono || null
          const resolvedDni = post?.dni || rawUser?.dni || metaDni || null
          const resolvedLocalidad = post?.localidad || rawUser?.localidad || metaLocalidad || null
          const resolvedDireccion = post?.direccion || rawUser?.direccion || metaDireccion || null
          const resolvedCodigoPostal = post?.codigo_postal || rawUser?.codigo_postal || metaCodigoPostal || null
          const resolvedEstadoLaboral = post?.estado_laboral || metaEstadoLaboral || null

          derivacionesProcesadas.push({
            derivacionId: derivacion.id,
            notaMunicipalidad: derivacion.nota_municipalidad ?? null,
            estadoEmpresa: derivacion.estado_empresa ?? 'pendiente',
            fechaDerivacion: derivacion.created_at,
            ofertaTitulo: of.titulo,
            ofertaId: of.id,
            postulante: {
              nombre: resolvedNombre,
              apellido: resolvedApellido,
              email: resolvedEmail,
              telefono: resolvedTelefono,
              dni: resolvedDni,
              localidad: resolvedLocalidad,
              direccion: resolvedDireccion,
              codigo_postal: resolvedCodigoPostal,
              estudios: post?.estudios ?? null,
              cursos: post?.cursos ?? null,
              experiencia: post?.experiencia ?? null,
              idiomas: post?.idiomas ?? null,
              habilidades: post?.habilidades ?? null,
              horarios: post?.horarios ?? null,
              estado_laboral: resolvedEstadoLaboral,
            },
            cvs: cvsSigned,
          })
        }
      }
    }
  }

  // Mapa de cantidad de derivaciones por oferta
  const cantDerivacionesPorOferta = new Map<string, number>()
  derivacionesProcesadas.forEach((d) => {
    const actual = cantDerivacionesPorOferta.get(d.ofertaId) ?? 0
    cantDerivacionesPorOferta.set(d.ofertaId, actual + 1)
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Encabezado Principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase tracking-wider">
              {empresa?.rubro || 'Empresa Empleadora'}
            </span>
            {empresa?.cuit && (
              <span className="text-xs text-gray-400 font-mono">CUIT: {empresa.cuit}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            {razonSocial || 'Panel de Empresa'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestioná tus búsquedas laborales y revisá los postulantes derivados por la Dirección de Empleo.
          </p>
        </div>

        <Link
          href="/empresa/nueva-oferta"
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm inline-flex items-center gap-2 shrink-0"
        >
          <span>+</span> Publicar nueva oferta
        </Link>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ofertas Activas</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{ofertasPublicadas}</span>
            <span className="text-xs text-gray-400">visibles en el portal</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total de Ofertas</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{totalOfertas}</span>
            <span className="text-xs text-gray-400">publicadas</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Postulantes Derivados</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-700">{derivacionesProcesadas.length}</span>
            <span className="text-xs text-gray-400">por el municipio</span>
          </div>
        </div>
      </div>

      {/* Sección 1: Mis Ofertas Laborales */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Mis Ofertas Laborales</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Búsquedas laborales registradas por tu empresa en el sistema municipal.
            </p>
          </div>

          <Link
            href="/empresa/nueva-oferta"
            className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl transition-colors"
          >
            + Nueva búsqueda
          </Link>
        </div>

        {ofertas.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="text-4xl block">📋</span>
            <h3 className="font-semibold text-gray-800">Todavía no publicaste ninguna oferta</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Comenzá a reclutar talento publicando tu primera oferta de empleo para los vecinos de la ciudad.
            </p>
            <div className="pt-2">
              <Link
                href="/empresa/nueva-oferta"
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors inline-block"
              >
                Publicar primera oferta
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ofertas.map((oferta) => {
              const cantDerivados = cantDerivacionesPorOferta.get(oferta.id) ?? 0
              return (
                <div
                  key={oferta.id}
                  className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href={`/ofertas/${oferta.id}`}
                        className="font-bold text-base text-gray-900 hover:text-teal-700 transition-colors"
                      >
                        {oferta.titulo}
                      </Link>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                          oferta.estado === 'publicada'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : oferta.estado === 'pendiente'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {oferta.estado === 'publicada'
                          ? 'Publicada'
                          : oferta.estado === 'pendiente'
                          ? 'Pendiente de aprobación'
                          : oferta.estado === 'cerrada'
                          ? 'Cerrada'
                          : oferta.estado}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2">
                      {oferta.descripcion}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 font-mono">
                      <span>Publicado: {new Date(oferta.created_at).toLocaleDateString('es-AR')}</span>
                      <span className="text-teal-700 font-semibold font-sans">
                        👥 {cantDerivados} {cantDerivados === 1 ? 'postulante derivado' : 'postulantes derivados'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/empresa/ofertas/${oferta.id}/candidatos`}
                      className="text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>👥 Ver candidatos ({cantDerivados})</span>
                    </Link>
                    <Link
                      href={`/ofertas/${oferta.id}`}
                      className="text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Ver en portal
                    </Link>
                    <CambiarEstadoBoton ofertaId={oferta.id} estadoActual={oferta.estado} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Sección 2: Candidatos Derivados por la Municipalidad */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Postulantes Derivados por la Municipalidad</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Candidatos preseleccionados y recomendados por el equipo de intermediación laboral del municipio. Podés ver su perfil completo, CV y datos de contacto.
          </p>
        </div>

        <DerivacionesEmpresaClient derivaciones={derivacionesProcesadas} />
      </section>
    </div>
  )
}
