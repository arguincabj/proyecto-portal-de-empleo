import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CambiarEstadoBoton } from './cambiar-estado-boton'

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

  const razonSocial = empresa?.razon_social ?? ''

  // 3. Obtener ofertas creadas por esta empresa (por id o por razon_social)
  const queryOfertas = empresa?.id
    ? supabaseAdmin.from('ofertas').select(`
        id,
        titulo,
        descripcion,
        estado,
        created_at,
        postulaciones (count)
      `).or(`empresa_id.eq.${empresa.id},empresa_nombre.eq.${razonSocial}`)
    : supabaseAdmin.from('ofertas').select(`
        id,
        titulo,
        descripcion,
        estado,
        created_at,
        postulaciones (count)
      `).eq('empresa_nombre', razonSocial)

  const { data: ofertasData } = await queryOfertas.order('created_at', { ascending: false })

  const ofertas = ofertasData ?? []

  // 4. Calcular métricas
  const totalOfertas = ofertas.length
  const ofertasPublicadas = ofertas.filter((o) => o.estado === 'publicada').length

  // 5. Obtener derivaciones enviadas por la municipalidad a esta empresa
  const ofertaIds = ofertas.map((o) => o.id)
  const ofertasMap = new Map(ofertas.map((o) => [o.id, o]))

  interface DerivacionItem {
    id: string
    nota_municipalidad: string | null
    estado_empresa: string
    nota_empresa: string | null
    created_at: string
    puesto: string
    postulanteNombre: string
    telefono: string | null
    email: string | null
    cvUrl: string | null
  }

  let derivaciones: DerivacionItem[] = []

  if (ofertaIds.length > 0) {
    // 5.1 Buscar postulaciones para las ofertas de esta empresa
    const { data: postulacionesData } = await supabaseAdmin
      .from('postulaciones')
      .select('id, oferta_id, postulante_id, cv_id')
      .in('oferta_id', ofertaIds)

    const postulaciones = postulacionesData ?? []
    const postulacionIds = postulaciones.map((p) => p.id)
    const postulacionesMap = new Map(postulaciones.map((p) => [p.id, p]))

    if (postulacionIds.length > 0) {
      // 5.2 Obtener derivaciones para estas postulaciones
      const { data: derivacionesData } = await supabaseAdmin
        .from('derivaciones')
        .select('id, postulacion_id, nota_municipalidad, estado_empresa, nota_empresa, created_at')
        .in('postulacion_id', postulacionIds)
        .order('created_at', { ascending: false })

      const rawDerivaciones = derivacionesData ?? []

      // 5.3 Obtener postulantes, usuarios y CVs involucrados
      const postulanteIds = Array.from(new Set(postulaciones.map((p) => p.postulante_id).filter(Boolean)))
      const cvIds = Array.from(new Set(postulaciones.map((p) => p.cv_id).filter(Boolean) as string[]))

      const [postulantesRes, curriculaRes] = await Promise.all([
        postulanteIds.length > 0
          ? supabaseAdmin.from('postulantes').select('id, usuario_id, cv_url').in('id', postulanteIds)
          : Promise.resolve({ data: [] }),
        cvIds.length > 0
          ? supabaseAdmin.from('curricula').select('id, url, nombre').in('id', cvIds)
          : Promise.resolve({ data: [] }),
      ])

      const postulantesMap = new Map((postulantesRes.data ?? []).map((p) => [p.id, p]))
      const curriculaMap = new Map((curriculaRes.data ?? []).map((c) => [c.id, c]))

      const usuarioIds = Array.from(
        new Set((postulantesRes.data ?? []).map((p) => p.usuario_id).filter(Boolean) as string[])
      )

      const usuariosRes = usuarioIds.length > 0
        ? await supabaseAdmin.from('usuarios').select('id, nombre, apellido, telefono').in('id', usuarioIds)
        : { data: [] }

      const usuariosMap = new Map((usuariosRes.data ?? []).map((u) => [u.id, u]))

      // Obtener emails de auth para cada usuario
      const emailsMap = new Map<string, string>()
      await Promise.all(
        usuarioIds.map(async (uid) => {
          try {
            const { data } = await supabaseAdmin.auth.admin.getUserById(uid)
            if (data?.user?.email) {
              emailsMap.set(uid, data.user.email)
            }
          } catch {
            // Ignorar errores puntuales de auth
          }
        })
      )

      // Generar URLs firmadas de CVs
      const cvFirmadas: Record<string, string> = {}
      const cvPaths = Array.from(
        new Set([
          ...Array.from(postulantesMap.values()).map((p) => p.cv_url).filter(Boolean),
          ...Array.from(curriculaMap.values()).map((c) => c.url).filter(Boolean),
        ] as string[])
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
              const { data: d2 } = await supabaseAdmin.storage.from('curricula').createSignedUrl(path, 3600)
              if (d2?.signedUrl) {
                cvFirmadas[path] = d2.signedUrl
              }
            }
          } catch {
            // Ignorar errores al firmar
          }
        })
      )

      // Construir listado de derivaciones listo para la vista
      derivaciones = rawDerivaciones.map((d) => {
        const post = postulacionesMap.get(d.postulacion_id)
        const oferta = post?.oferta_id ? ofertasMap.get(post.oferta_id) : null
        const postulante = post?.postulante_id ? postulantesMap.get(post.postulante_id) : null
        const usuarioPostulante = postulante?.usuario_id ? usuariosMap.get(postulante.usuario_id) : null
        const userEmail = postulante?.usuario_id ? emailsMap.get(postulante.usuario_id) ?? null : null

        const cvElegido = post?.cv_id ? curriculaMap.get(post.cv_id) : null
        const cvPath = cvElegido ? cvElegido.url : postulante?.cv_url
        const cvUrl = cvPath ? cvFirmadas[cvPath] ?? (cvPath.startsWith('http') ? cvPath : null) : null

        return {
          id: d.id,
          nota_municipalidad: d.nota_municipalidad,
          estado_empresa: d.estado_empresa,
          nota_empresa: d.nota_empresa,
          created_at: d.created_at,
          puesto: oferta?.titulo ?? 'Puesto no disponible',
          postulanteNombre: usuarioPostulante
            ? `${usuarioPostulante.nombre} ${usuarioPostulante.apellido}`
            : 'Postulante',
          telefono: usuarioPostulante?.telefono ?? null,
          email: userEmail,
          cvUrl,
        }
      })
    }
  }
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
            <span className="text-3xl font-extrabold text-teal-700">{derivaciones.length}</span>
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
              const cantPostulaciones = oferta.postulaciones?.[0]?.count ?? 0
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
                      <span>👥 {cantPostulaciones} postulaciones recibidas</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
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
            Candidatos preseleccionados y recomendados por el equipo de intermediación laboral del municipio.
          </p>
        </div>

        {derivaciones.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Aún no hay postulantes derivados por la Oficina de Empleo para tus ofertas vigentes.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {derivaciones.map((derivacion) => {
              return (
                <div key={derivacion.id} className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {derivacion.postulanteNombre}
                      </h4>
                      <p className="text-xs text-teal-700 font-medium">Para el puesto: {derivacion.puesto}</p>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-800 border border-blue-200 capitalize">
                      Estado: {derivacion.estado_empresa}
                    </span>
                  </div>

                  {derivacion.nota_municipalidad && (
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900">
                      <strong>Nota de la Oficina Municipal:</strong> {derivacion.nota_municipalidad}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      {derivacion.email && <span>📧 {derivacion.email}</span>}
                      {derivacion.telefono && <span>📞 {derivacion.telefono}</span>}
                    </div>

                    {derivacion.cvUrl ? (
                      <a
                        href={derivacion.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 hover:underline font-medium"
                      >
                        📄 Ver Curriculum Vitae
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Sin CV adjunto</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
