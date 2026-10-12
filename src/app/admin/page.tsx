import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { BotonModerarOferta } from './boton-moderar'
import { Shield, Briefcase, Clock, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react'

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

  // Calcular métricas
  const totalOfertas = ofertas.length
  const pendientes = ofertas.filter((o) => o.estado === 'pendiente').length
  const publicadas = ofertas.filter((o) => o.estado === 'publicada').length
  const cerradas = ofertas.filter((o) => o.estado === 'cerrada').length

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
    </div>
  )
}
