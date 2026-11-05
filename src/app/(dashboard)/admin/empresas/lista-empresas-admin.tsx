'use client'

import { useState, useRef, useMemo } from 'react'
import { Building2, Search, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { BotonModerarEmpresa } from '../boton-moderar-empresa'
import { Paginacion } from '@/components/ui/paginacion'
import { EmpresaNombreModal } from '../empresa-nombre-modal'

export type EmpresaAdminItem = {
  id: string
  razon_social: string | null
  cuit: string | null
  rubro: string | null
  descripcion?: string | null
  email: string | null
  estado_aprobacion: string
  motivo_rechazo?: string | null
  created_at: string
  usuario?: unknown
}

type Props = {
  empresas: EmpresaAdminItem[]
}

const ITEMS_POR_PAGINA = 15

export function ListaEmpresasAdmin({ empresas }: Props) {
  const [paginaActual, setPaginaActual] = useState(1)
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'pendiente' | 'aprobada' | 'rechazada'>('todas')
  const [busqueda, setBusqueda] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const conteoPendientes = useMemo(
    () => empresas.filter((e) => e.estado_aprobacion === 'pendiente').length,
    [empresas]
  )
  const conteoAprobadas = useMemo(
    () => empresas.filter((e) => e.estado_aprobacion === 'aprobada').length,
    [empresas]
  )
  const conteoRechazadas = useMemo(
    () => empresas.filter((e) => e.estado_aprobacion === 'rechazada').length,
    [empresas]
  )

  const empresasFiltradas = useMemo(() => {
    return empresas.filter((e) => {
      if (filtroEstado !== 'todas' && e.estado_aprobacion !== filtroEstado) {
        return false
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const matchRazon = e.razon_social?.toLowerCase().includes(q)
        const matchCuit = e.cuit?.toLowerCase().includes(q)
        const matchRubro = e.rubro?.toLowerCase().includes(q)
        const matchEmail = e.email?.toLowerCase().includes(q)
        return Boolean(matchRazon || matchCuit || matchRubro || matchEmail)
      }
      return true
    })
  }, [empresas, filtroEstado, busqueda])

  const totalPaginas = Math.ceil(empresasFiltradas.length / ITEMS_POR_PAGINA) || 1
  const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas)
  const inicio = (paginaValida - 1) * ITEMS_POR_PAGINA
  const fin = Math.min(inicio + ITEMS_POR_PAGINA, empresasFiltradas.length)
  const empresasVisibles = empresasFiltradas.slice(inicio, fin)

  const manejarCambioPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina)
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const cambiarFiltro = (nuevoFiltro: 'todas' | 'pendiente' | 'aprobada' | 'rechazada') => {
    setFiltroEstado(nuevoFiltro)
    setPaginaActual(1)
  }

  return (
    <div ref={containerRef}>
      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => cambiarFiltro('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtroEstado === 'todas'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todas ({empresas.length})
          </button>
          <button
            onClick={() => cambiarFiltro('pendiente')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtroEstado === 'pendiente'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Clock className="size-3.5" />
            Pendientes ({conteoPendientes})
          </button>
          <button
            onClick={() => cambiarFiltro('aprobada')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtroEstado === 'aprobada'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="size-3.5" />
            Aprobadas ({conteoAprobadas})
          </button>
          <button
            onClick={() => cambiarFiltro('rechazada')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtroEstado === 'rechazada'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-rose-800 hover:bg-rose-50'
            }`}
          >
            <XCircle className="size-3.5" />
            Rechazadas ({conteoRechazadas})
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="size-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPaginaActual(1)
            }}
            placeholder="Buscar por empresa, CUIT o rubro..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>
      </div>

      {empresasFiltradas.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <Building2 className="size-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">
            {empresas.length === 0
              ? 'No hay empresas registradas aún'
              : 'No se encontraron empresas con este filtro'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {empresas.length === 0
              ? 'Las empresas aparecerán aquí cuando se registren en el portal.'
              : 'Probá seleccionando otro estado o cambiando los términos de búsqueda.'}
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-100">
            {empresasVisibles.map((empresa) => {
              const isPendiente = empresa.estado_aprobacion === 'pendiente'
              const isRechazada = empresa.estado_aprobacion === 'rechazada'

              const rawUsuario = empresa.usuario
              const responsable = (Array.isArray(rawUsuario) ? rawUsuario[0] : rawUsuario) as {
                nombre?: string | null
                apellido?: string | null
                telefono?: string | null
              } | null | undefined

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
                      <EmpresaNombreModal
                        empresa={{
                          id: empresa.id,
                          razonSocial: empresa.razon_social || '',
                          cuit: empresa.cuit,
                          rubro: empresa.rubro,
                          descripcion: empresa.descripcion ?? null,
                          email: empresa.email,
                          estadoAprobacion: empresa.estado_aprobacion,
                          motivoRechazo: empresa.motivo_rechazo ?? null,
                          fechaRegistro: new Date(empresa.created_at).toLocaleDateString('es-AR'),
                          responsable: responsable
                            ? {
                                nombre: responsable.nombre || '',
                                apellido: responsable.apellido || '',
                                telefono: responsable.telefono ?? null,
                              }
                            : null,
                        }}
                      />
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
                        {(responsable?.nombre || responsable?.apellido) && (
                          <span>👤 {[responsable.nombre, responsable.apellido].filter(Boolean).join(' ')}</span>
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

          {/* Pie de lista con paginación */}
          <Paginacion
            paginaActual={paginaValida}
            totalPaginas={totalPaginas}
            totalItems={empresasFiltradas.length}
            itemsPorPagina={ITEMS_POR_PAGINA}
            nombreItems="empresas"
            onCambiarPagina={manejarCambioPagina}
          />
        </>
      )}
    </div>
  )
}
