import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AdminNavTabs } from './admin-nav-tabs'
import { ListaOfertasAdmin, OfertaAdminItem } from './lista-ofertas-admin'
import { AdminMetricasGraficos, type AdminStatsData } from './admin-metricas-graficos'
import { Shield, AlertTriangle, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

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

  // Contar empresas pendientes para el badge de la pestaña
  const { count: empresasPendientesCount } = await supabaseAdmin
    .from('empresas')
    .select('id', { count: 'exact', head: true })
    .eq('estado_aprobacion', 'pendiente')

  // Contar postulaciones pendientes para el badge de la pestaña
  const { count: postulantesPendientesCount } = await supabaseAdmin
    .from('postulaciones')
    .select('id', { count: 'exact', head: true })
    .in('estado', ['recibida', 'en_revision'])

  // 1. Obtener todas las ofertas creadas en el sistema usando admin client
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

  const ofertas = (ofertasRaw ?? []) as unknown as OfertaAdminItem[]

  // 2. Obtener datos reales de empresas, postulaciones y postulantes para métricas y gráficos
  const [empresasRes, postulacionesRes, postulantesRes] = await Promise.all([
    supabaseAdmin.from('empresas').select('id, estado_aprobacion, rubro'),
    supabaseAdmin.from('postulaciones').select('id, oferta_id, estado'),
    supabaseAdmin.from('postulantes').select('id, estado_laboral'),
  ])

  const empresasData = empresasRes.data ?? []
  const postulacionesData = postulacionesRes.data ?? []
  const postulantesData = postulantesRes.data ?? []

  // Calcular métricas de ofertas
  const totalOfertas = ofertas.length
  const pendientes = ofertas.filter((o) => o.estado === 'pendiente').length
  const publicadas = ofertas.filter((o) => o.estado === 'publicada').length
  const cerradas = ofertas.filter((o) => o.estado === 'cerrada').length

  // Métricas de empresas
  const empresasAprobadas = empresasData.filter((e) => e.estado_aprobacion === 'aprobada').length
  const empresasPendientes = empresasData.filter((e) => e.estado_aprobacion === 'pendiente').length
  const empresasRechazadas = empresasData.filter((e) => e.estado_aprobacion === 'rechazada').length

  // Métricas de postulaciones
  const postDerivadas = postulacionesData.filter((p) => p.estado === 'derivada').length
  const postRecibidas = postulacionesData.filter((p) => p.estado === 'recibida' || p.estado === 'en_revision').length
  const postRechazadas = postulacionesData.filter((p) => p.estado === 'rechazada_municipalidad').length

  // Métricas de postulantes
  const postulantesEnBusqueda = postulantesData.filter((p) => p.estado_laboral !== 'empleado').length
  const postulantesEmpleado = postulantesData.filter((p) => p.estado_laboral === 'empleado').length

  // Vacantes con mayor demanda
  const conteoPostulacionesPorOferta = new Map<string, number>()
  postulacionesData.forEach((p) => {
    if (p.oferta_id) {
      conteoPostulacionesPorOferta.set(p.oferta_id, (conteoPostulacionesPorOferta.get(p.oferta_id) || 0) + 1)
    }
  })

  const topOfertasPostuladas = ofertas
    .map((o) => ({
      titulo: o.titulo,
      empresa: o.empresa_nombre || 'Empresa local',
      postulaciones: conteoPostulacionesPorOferta.get(o.id) || (o.postulaciones?.[0]?.count ?? 0),
    }))
    .sort((a, b) => b.postulaciones - a.postulaciones)
    .filter((o) => o.postulaciones > 0)

  const adminStats: AdminStatsData = {
    totalOfertas,
    ofertasPendientes: pendientes,
    ofertasPublicadas: publicadas,
    ofertasCerradas: cerradas,

    totalPostulaciones: postulacionesData.length,
    postulacionesRecibidas: postRecibidas,
    postulacionesDerivadas: postDerivadas,
    postulacionesRechazadas: postRechazadas,

    totalEmpresas: empresasData.length,
    empresasAprobadas,
    empresasPendientes,
    empresasRechazadas,

    totalPostulantes: postulantesData.length,
    postulantesEnBusqueda,
    postulantesEmpleado,

    topOfertasPostuladas,
  }

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
            Aprobación de Ofertas
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

      {/* Panel Superior de Estadísticas y Gráficos con Datos Reales */}
      <AdminMetricasGraficos stats={adminStats} />

      {/* Pestañas de navegación entre Ofertas, Empresas y Postulantes */}
      <AdminNavTabs
        tabActivo="ofertas"
        pendientesOfertas={pendientes}
        pendientesEmpresas={empresasPendientesCount ?? 0}
        pendientesPostulantes={postulantesPendientesCount ?? 0}
      />

      {/* Listado y Moderación de Ofertas con paginación de 15 por página */}
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
        ) : (
          <ListaOfertasAdmin ofertas={ofertas} />
        )}
      </div>
    </div>
  )
}
