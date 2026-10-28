'use client'

import {
  Briefcase,
  Users,
  Building2,
  Clock,
  Send,
  UserCheck,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react'

export interface AdminStatsData {
  totalOfertas: number
  ofertasPendientes: number
  ofertasPublicadas: number
  ofertasCerradas: number

  totalPostulaciones: number
  postulacionesRecibidas: number
  postulacionesDerivadas: number
  postulacionesRechazadas: number

  totalEmpresas: number
  empresasAprobadas: number
  empresasPendientes: number
  empresasRechazadas: number

  totalPostulantes: number
  postulantesEnBusqueda: number
  postulantesEmpleado: number

  topOfertasPostuladas: Array<{
    titulo: string
    empresa: string
    postulaciones: number
  }>
}

interface Props {
  stats: AdminStatsData
}

export function AdminMetricasGraficos({ stats }: Props) {
  // Cálculos para gráfico de Ofertas
  const pctOfertasPub = stats.totalOfertas ? Math.round((stats.ofertasPublicadas / stats.totalOfertas) * 100) : 0
  const pctOfertasPen = stats.totalOfertas ? Math.round((stats.ofertasPendientes / stats.totalOfertas) * 100) : 0
  const pctOfertasCer = stats.totalOfertas ? Math.round((stats.ofertasCerradas / stats.totalOfertas) * 100) : 0

  // Cálculos para gráfico de Postulaciones y Derivaciones
  const pctPostDer = stats.totalPostulaciones ? Math.round((stats.postulacionesDerivadas / stats.totalPostulaciones) * 100) : 0
  const pctPostRec = stats.totalPostulaciones ? Math.round((stats.postulacionesRecibidas / stats.totalPostulaciones) * 100) : 0
  const pctPostRech = stats.totalPostulaciones ? Math.round((stats.postulacionesRechazadas / stats.totalPostulaciones) * 100) : 0

  // Máximo para barras de ofertas más demandadas
  const maxPostulaciones = Math.max(...stats.topOfertasPostuladas.map((o) => o.postulaciones), 1)

  return (
    <div className="space-y-6">
      {/* 1. Tarjetas KPI de Resumen General */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI Ofertas */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
              Ofertas Totales
            </span>
            <div className="size-8 rounded-lg bg-teal-100/70 text-teal-700 flex items-center justify-center">
              <Briefcase className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{stats.totalOfertas}</span>
            <span className="text-xs text-emerald-600 font-semibold">{stats.ofertasPublicadas} activas</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
            <Clock className="size-3 text-amber-500" />
            <span>{stats.ofertasPendientes} pendientes de revisión</span>
          </div>
        </div>

        {/* KPI Postulaciones */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md">
              Postulaciones
            </span>
            <div className="size-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center">
              <Send className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{stats.totalPostulaciones}</span>
            <span className="text-xs text-teal-700 font-semibold">{stats.postulacionesDerivadas} derivadas</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-blue-500" />
            <span>{stats.postulacionesRecibidas} en proceso inicial</span>
          </div>
        </div>

        {/* KPI Empresas Registradas */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md">
              Empresas
            </span>
            <div className="size-8 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center">
              <Building2 className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{stats.totalEmpresas}</span>
            <span className="text-xs text-emerald-600 font-semibold">{stats.empresasAprobadas} aprobadas</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span>{stats.empresasPendientes} por verificar</span>
          </div>
        </div>

        {/* KPI Postulantes en el Padrón */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
              Vecinos Postulantes
            </span>
            <div className="size-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{stats.totalPostulantes}</span>
            <span className="text-xs text-emerald-700 font-semibold">perfiles activos</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
            <UserCheck className="size-3 text-emerald-600" />
            <span>{stats.postulantesEnBusqueda} en búsqueda activa</span>
          </div>
        </div>
      </div>

      {/* 2. Sección Gráfica con Visualizaciones de Datos Reales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Gráfico A: Estado del Embudo de Postulaciones y Derivaciones (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <BarChart3 className="size-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Embudo de Gestión de Postulaciones</h3>
              </div>
              <span className="text-xs font-mono font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                Total: {stats.totalPostulaciones}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Distribución y avance de los candidatos postulados hasta su derivación a las empresas locales.
            </p>

            {/* Barra compuesta visual tipo Gauge / Segmented Bar */}
            <div className="mt-5 space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${pctPostDer}%` }}
                  className="bg-teal-600 transition-all duration-700"
                  title={`Derivadas a Empresa: ${stats.postulacionesDerivadas} (${pctPostDer}%)`}
                />
                <div
                  style={{ width: `${pctPostRec}%` }}
                  className="bg-amber-400 transition-all duration-700"
                  title={`Pendientes / En Revisión: ${stats.postulacionesRecibidas} (${pctPostRec}%)`}
                />
                <div
                  style={{ width: `${pctPostRech}%` }}
                  className="bg-rose-400 transition-all duration-700"
                  title={`No enviadas: ${stats.postulacionesRechazadas} (${pctPostRech}%)`}
                />
              </div>

              {/* Leyenda y Detalles Numéricos */}
              <div className="grid grid-cols-3 gap-2 pt-3">
                <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-3 text-left">
                  <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs">
                    <span className="size-2 rounded-full bg-teal-600" />
                    <span>Derivadas a Empresa</span>
                  </div>
                  <p className="text-xl font-extrabold text-teal-950 mt-1">{stats.postulacionesDerivadas}</p>
                  <p className="text-[11px] text-teal-700 font-medium">{pctPostDer}% del total</p>
                </div>

                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 text-left">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <span className="size-2 rounded-full bg-amber-400" />
                    <span>En Revisión Inicial</span>
                  </div>
                  <p className="text-xl font-extrabold text-amber-950 mt-1">{stats.postulacionesRecibidas}</p>
                  <p className="text-[11px] text-amber-700 font-medium">{pctPostRec}% del total</p>
                </div>

                <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 text-left">
                  <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                    <span className="size-2 rounded-full bg-rose-400" />
                    <span>No Enviadas</span>
                  </div>
                  <p className="text-xl font-extrabold text-rose-950 mt-1">{stats.postulacionesRechazadas}</p>
                  <p className="text-[11px] text-rose-700 font-medium">{pctPostRech}% del total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Barras Horizontales: Top Ofertas con mayor demanda */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Vacantes con Mayor Demanda de Vecinos
              </h4>
              <span className="text-[11px] text-gray-400 font-medium">Postulaciones</span>
            </div>

            {stats.topOfertasPostuladas.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No hay postulaciones registradas aún.</p>
            ) : (
              <div className="space-y-3">
                {stats.topOfertasPostuladas.slice(0, 3).map((item, idx) => {
                  const barWidth = Math.round((item.postulaciones / maxPostulaciones) * 100)
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 truncate max-w-[280px]" title={item.titulo}>
                          {item.titulo}
                        </span>
                        <span className="font-mono font-bold text-teal-700 shrink-0 ml-2">
                          {item.postulaciones} {item.postulaciones === 1 ? 'postulante' : 'postulantes'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${barWidth}%` }}
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Gráfico B: Estado de las Ofertas y Aprobación de Empresas (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card: Estado del Catálogo de Ofertas */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <PieIcon className="size-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Estado de Ofertas</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {stats.totalOfertas} cargadas
              </span>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Balance de ofertas en cartelera vs. en revisión municipal.
            </p>

            {/* Barras de progreso porcentuales */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-emerald-800 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Publicadas y Activas
                  </span>
                  <span className="font-bold text-gray-900 font-mono">
                    {stats.ofertasPublicadas} ({pctOfertasPub}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pctOfertasPub}%` }}
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-amber-800 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Pendientes de Aprobación
                  </span>
                  <span className="font-bold text-gray-900 font-mono">
                    {stats.ofertasPendientes} ({pctOfertasPen}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pctOfertasPen}%` }}
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-gray-400" />
                    Cerradas / Finalizadas
                  </span>
                  <span className="font-bold text-gray-900 font-mono">
                    {stats.ofertasCerradas} ({pctOfertasCer}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pctOfertasCer}%` }}
                    className="h-full bg-gray-400 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Registro y Verificación de Empresas Locales */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Building2 className="size-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Validación de Empresas</h3>
              </div>
              <span className="text-xs font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full">
                {stats.totalEmpresas} locales
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                  Aprobadas
                </span>
                <span className="text-2xl font-black text-emerald-900 mt-1 block">
                  {stats.empresasAprobadas}
                </span>
                <span className="text-[10px] text-emerald-700">Con permiso para publicar</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
                  Por Validar
                </span>
                <span className="text-2xl font-black text-amber-900 mt-1 block">
                  {stats.empresasPendientes}
                </span>
                <span className="text-[10px] text-amber-700">En cola de revisión CUIT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
