import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AdminNavTabs } from '../admin-nav-tabs'
import { ListaEmpresasAdmin, EmpresaAdminItem } from './lista-empresas-admin'
import { Shield, Building2, CheckCircle2, Clock, XCircle, AlertTriangle, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminEmpresasPage() {
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

  // Contar ofertas pendientes para el badge de la pestaña
  const { count: ofertasPendientesCount } = await supabaseAdmin
    .from('ofertas')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  // Obtener todos los perfiles de empresa
  const { data: initialEmpresas, error: errorEmpresas } = await supabaseAdmin
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

  let empresasRaw = initialEmpresas

  if (errorEmpresas && errorEmpresas.message?.includes('motivo_rechazo')) {
    const fallback = await supabaseAdmin
      .from('empresas')
      .select(`
        id,
        razon_social,
        cuit,
        rubro,
        email,
        estado_aprobacion,
        created_at,
        usuario:usuarios!inner (
          nombre,
          apellido,
          telefono
        )
      `)
      .order('created_at', { ascending: false })
    empresasRaw = (fallback.data ?? []).map((e) => ({ ...e, motivo_rechazo: null }))
  }

  const empresas = (empresasRaw ?? []) as unknown as EmpresaAdminItem[]

  // Métricas de empresas
  const totalEmpresas = empresas.length
  const empresasPendientes = empresas.filter((e) => e.estado_aprobacion === 'pendiente').length
  const empresasAprobadas = empresas.filter((e) => e.estado_aprobacion === 'aprobada').length
  const empresasRechazadas = empresas.filter((e) => e.estado_aprobacion === 'rechazada').length

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
            Aprobación de Empresas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenido, {usuario.nombre} {usuario.apellido}. Revisá, aprobá o rechazá los perfiles registrados por las empresas.
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

      {/* Pestañas de navegación entre Ofertas y Empresas */}
      <AdminNavTabs
        tabActivo="empresas"
        pendientesOfertas={ofertasPendientesCount ?? 0}
        pendientesEmpresas={empresasPendientes}
      />

      {/* Tarjetas de Métricas de Empresas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pendientes de Revisión</p>
            <Clock className="size-4 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-900 mt-3">{empresasPendientes}</p>
          <p className="text-xs text-amber-700 mt-1">Requieren aprobación</p>
        </div>

        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Empresas Aprobadas</p>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-900 mt-3">{empresasAprobadas}</p>
          <p className="text-xs text-emerald-700 mt-1">Habilitadas para publicar</p>
        </div>

        <div className="bg-red-50 rounded-2xl border border-red-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Empresas Rechazadas</p>
            <XCircle className="size-4 text-red-600" />
          </div>
          <p className="text-3xl font-black text-red-900 mt-3">{empresasRechazadas}</p>
          <p className="text-xs text-red-700 mt-1">Con observaciones pendientes</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total de Empresas</p>
            <Building2 className="size-4 text-teal-600" />
          </div>
          <p className="text-3xl font-black text-gray-900 mt-3">{totalEmpresas}</p>
          <p className="text-xs text-gray-500 mt-1">Registradas en el sistema</p>
        </div>
      </div>

      {/* Sección: Perfiles de Empresa con paginación de 15 por página */}
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

        <ListaEmpresasAdmin empresas={empresas} />
      </div>
    </div>
  )
}
