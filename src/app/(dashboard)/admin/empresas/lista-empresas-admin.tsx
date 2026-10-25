'use client'

import { useState } from 'react'
import { Building2, ChevronDown } from 'lucide-react'
import { BotonModerarEmpresa } from '../boton-moderar-empresa'

export type EmpresaAdminItem = {
  id: string
  razon_social: string | null
  cuit: string | null
  rubro: string | null
  email: string | null
  estado_aprobacion: string
  motivo_rechazo?: string | null
  created_at: string
  usuario?: unknown
}

type Props = {
  empresas: EmpresaAdminItem[]
}

const PASO_PAGINACION = 15

export function ListaEmpresasAdmin({ empresas }: Props) {
  const [limite, setLimite] = useState(PASO_PAGINACION)

  if (empresas.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        <Building2 className="size-10 text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-700">No hay empresas registradas aún</p>
        <p className="text-xs text-gray-400 mt-1">Las empresas aparecerán aquí cuando se registren en el portal.</p>
      </div>
    )
  }

  const empresasVisibles = empresas.slice(0, limite)
  const hayMas = limite < empresas.length
  const restantes = empresas.length - limite

  return (
    <div>
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
      <div className="p-4 bg-gray-50/60 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Mostrando <span className="font-semibold text-gray-800">{empresasVisibles.length}</span> de{' '}
          <span className="font-semibold text-gray-800">{empresas.length}</span> empresas
        </p>

        {hayMas ? (
          <button
            type="button"
            onClick={() => setLimite((prev) => prev + PASO_PAGINACION)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-sm"
          >
            <span>Cargar más perfiles de empresas ({Math.min(PASO_PAGINACION, restantes)} más)</span>
            <ChevronDown className="size-3.5" />
          </button>
        ) : (
          empresas.length > PASO_PAGINACION && (
            <span className="text-xs text-gray-400 font-medium">Se mostraron todos los perfiles registrados</span>
          )
        )}
      </div>
    </div>
  )
}
