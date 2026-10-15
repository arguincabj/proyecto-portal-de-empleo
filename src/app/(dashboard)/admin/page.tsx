import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { BotonModerarOferta } from './boton-moderar'
import { BotonModerarEmpresa } from './boton-moderar-empresa'
import { Shield, Briefcase, Clock, CheckCircle2, XCircle, AlertTriangle, ExternalLink, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ESTADO_BADGE: Record<string, { label: string; class: string }> = {
  publicada: { label: 'Publicada', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pendiente: { label: 'Pendiente de revisión', class: 'bg-amber-50 text-amber-700 border-amber-200 font-bold' },
  cerrada: { label: 'Cerrada', class: 'bg-gray-100 text-gray-600 border-gray-200' },
  rechazada: { label: 'Rechazada', class: 'bg-red-50 text-red-700 border-red-200' },
}

export default async function AdminDashboardPage() {
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

  // Obtener todas las ofertas creadas en el sistema usando admin client
  const { data: ofertasRaw, error: errorOfertas } = await supabaseAdmin
    .from('ofertas')
    .select(`
      id,
      titulo,
      empresa_nombre,
      descripcion,
      estado,
      created_at,
      postulaciones (count)
    `)
    .order('created_at', { ascending: false })

  const ofertas = ofertasRaw ?? []

  // Calcular métricas de ofertas
  const totalOfertas = ofertas.length
  const pendientes = ofertas.filter((o) => o.estado === 'pendiente').length
  const publicadas = ofertas.filter((o) => o.estado === 'publicada').length
  const cerradas = ofertas.filter((o) => o.estado === 'cerrada').length

  // Obtener todos los perfiles de empresa
  const { data: empresasRaw } = await supabaseAdmin
    .from('empresas')
    .select(`
      id,
      razon_social,
      cuit,
      rubro,
      email,
      estado_aprobacion,
      motivo_rechazo,
      created_at,
      usuario:usuarios!inner (
        nombre,
        apellido,
        telefono
      )
    `)
    .order('created_at', { ascending: false })

  const empresas = (empresasRaw ?? []) as any[]
  const empresasPendientes = empresas.filter((e) => e.estado_aprobacion === 'pendiente').length

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs tracking-wider uppercase mb-1">
            <Shield className="size-4" />
            <span>Gestión Municipal de Empleo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Panel de Administración
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenido, {usuario.nombre} {usuario.apellido}. Moderá y aprobá las ofertas laborales cargadas por las empresas.
          </p>
        </div>

        <Link
          href="/ofertas"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-teal-700 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:border-teal-300 transition-colors shadow-sm self-start sm:self-auto"
        >
          <ExternalLink className="size-4" />
          <span>Ver portal público</span>
        </Link>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pendientes de Aprobación</p>
            <Clock className="size-4 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-900 mt-3">{pendientes}</p>
          <p className="text-xs text-amber-700 mt-1">Requieren revisión</p>
        </div>

        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Publicadas y Activas</p>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-900 mt-3">{publicadas}</p>
          <p className="text-xs text-emerald-700 mt-1">Visibles en el portal</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cerradas / Pausadas</p>
            <Briefcase className="size-4 text-gray-400" />
          </div>
          <p className="text-3xl font-black text-gray-800 mt-3">{cerradas}</p>
          <p className="text-xs text-gray-500 mt-1">Convocatoria finalizada</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total de Ofertas</p>
            <Briefcase className="size-4 text-teal-600" />
          </div>
          <p className="text-3xl font-black text-gray-900 mt-3">{totalOfertas}</p>
          <p className="text-xs text-gray-500 mt-1">Cargadas en el sistema</p>
        </div>
      </div>

      {/* Listado y Moderación de Ofertas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Listado de Ofertas Laborales</h2>
            <p className="text-xs text-gray-500">Revisá las ofertas pendientes para aprobar su publicación o cerrarlas.</p>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
          </span>
        </div>

        {errorOfertas ? (
          <div className="p-8 text-center text-sm text-red-600">
            Error al cargar las ofertas: {errorOfertas.message}
          </div>
        ) : ofertas.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Briefcase className="size-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No hay ofertas registradas aún</p>
            <p className="text-xs text-gray-400 mt-1">Cuando las empresas envíen ofertas laborales, aparecerán aquí para su moderación.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ofertas.map((oferta: any) => {
              const cantPostulaciones = oferta.postulaciones?.[0]?.count ?? 0
              const badge = ESTADO_BADGE[oferta.estado] ?? { label: oferta.estado, class: 'bg-gray-100 text-gray-600 border-gray-200' }
              const isPendiente = oferta.estado === 'pendiente'

              return (
                <div
                  key={oferta.id}
                  className={`p-6 transition-colors hover:bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isPendiente ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/ofertas/${oferta.id}`}
                        className="font-bold text-base text-gray-900 hover:text-teal-700 transition-colors"
                      >
                        {oferta.titulo}
                      </Link>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${badge.class}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-teal-800">
                      Empresa: {oferta.empresa_nombre || 'Sin especificar'}
                    </p>

                    <p className="text-xs text-gray-500 line-clamp-2">
                      {oferta.descripcion}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 font-mono">
                      <span>Cargada: {new Date(oferta.created_at).toLocaleDateString('es-AR')}</span>
                      <span>👥 {cantPostulaciones} postulaciones</span>
                    </div>
                  </div>

                  {/* Acciones de Moderación */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <BotonModerarOferta ofertaId={oferta.id} estadoActual={oferta.estado} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tarjetas de Métricas — segunda fila */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`rounded-2xl border p-5 shadow-sm ${empresasPendientes > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-bold uppercase tracking-wider ${empresasPendientes > 0 ? 'text-orange-800' : 'text-gray-500'}`}>
              Empresas pendientes de aprobación
            </p>
            <Building2 className={`size-4 ${empresasPendientes > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
          </div>
          <p className={`text-3xl font-black mt-3 ${empresasPendientes > 0 ? 'text-orange-900' : 'text-gray-800'}`}>
            {empresasPendientes}
          </p>
          <p className={`text-xs mt-1 ${empresasPendientes > 0 ? 'text-orange-700' : 'text-gray-500'}`}>
            Requieren revisión de perfil
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total de Empresas</p>
            <Building2 className="size-4 text-teal-600" />
          </div>
          <p className="text-3xl font-black text-gray-900 mt-3">{empresas.length}</p>
          <p className="text-xs text-gray-500 mt-1">Registradas en el sistema</p>
        </div>
      </div>

      {/* Sección: Perfiles de Empresa */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Perfiles de Empresa</h2>
            <p className="text-xs text-gray-500">Aprobá o rechazá los perfiles registrados por las empresas.</p>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {empresas.length} {empresas.length === 1 ? 'empresa' : 'empresas'}
          </span>
        </div>

        {empresas.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Building2 className="size-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No hay empresas registradas aún</p>
            <p className="text-xs text-gray-400 mt-1">Las empresas aparecerán aquí cuando se registren.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {empresas.map((empresa: any) => {
              const isPendiente = empresa.estado_aprobacion === 'pendiente'
              const isRechazada = empresa.estado_aprobacion === 'rechazada'
              const responsable = empresa.usuario

              const badgeConfig: Record<string, { label: string; cls: string }> = {
                pendiente: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200 font-bold' },
                aprobada: { label: 'Aprobada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                rechazada: { label: 'Rechazada', cls: 'bg-red-50 text-red-700 border-red-200' },
              }
              const badge = badgeConfig[empresa.estado_aprobacion] ?? badgeConfig.pendiente

              return (
                <div
                  key={empresa.id}
                  className={`p-6 transition-colors hover:bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isPendiente ? 'bg-amber-50/30' : isRechazada ? 'bg-red-50/20' : ''
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base text-gray-900">
                        {empresa.razon_social || 'Sin razón social'}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      {empresa.cuit && <span className="font-mono">CUIT: {empresa.cuit}</span>}
                      {empresa.rubro && <span>{empresa.rubro}</span>}
                    </div>

                    {(responsable || empresa.email) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                        {responsable && (
                          <span>
                            👤 {responsable.nombre} {responsable.apellido}
                          </span>
                        )}
                        {empresa.email && <span>📧 {empresa.email}</span>}
                        {responsable?.telefono && <span>📞 {responsable.telefono}</span>}
                      </div>
                    )}

                    {isRechazada && empresa.motivo_rechazo && (
                      <div className="bg-red-50/80 border border-red-200/80 rounded-xl p-3 text-xs text-red-900 mt-2">
                        <span className="font-semibold text-red-950">Motivo de rechazo enviado:</span>{' '}
                        {empresa.motivo_rechazo}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 font-mono">
                      Registrada: {new Date(empresa.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <BotonModerarEmpresa
                      empresaId={empresa.id}
                      estadoActual={empresa.estado_aprobacion}
                      motivoActual={empresa.motivo_rechazo}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

