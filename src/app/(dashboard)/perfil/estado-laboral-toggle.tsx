'use client'

import { useState, useTransition } from 'react'
import { Search, Briefcase, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { actualizarEstadoLaboral } from './actions'

type EstadoLaboral = 'en_busqueda' | 'trabajando'

interface Props {
  defaultEstado: EstadoLaboral
}

const ESTADOS = {
  en_busqueda: {
    label: 'En búsqueda laboral',
    desc: 'Estás buscando activamente nuevas oportunidades de empleo.',
    icon: Search,
    bgActive: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    bgInactive: 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    badgeIcon: '🟢',
  },
  trabajando: {
    label: 'Actualmente trabajando',
    desc: 'Tenés empleo activo pero podés estar abierto a nuevas propuestas.',
    icon: Briefcase,
    bgActive: 'bg-blue-600 text-white border-blue-600 shadow-sm',
    bgInactive: 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-700',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    badgeIcon: '🔵',
  },
} as const

export function EstadoLaboralToggle({ defaultEstado }: Props) {
  const [estado, setEstado] = useState<EstadoLaboral>(defaultEstado)
  const [isPending, startTransition] = useTransition()

  const estadoActual = ESTADOS[estado]

  function handleCambiar(nuevoEstado: EstadoLaboral) {
    if (nuevoEstado === estado || isPending) return
    const estadoAnterior = estado
    setEstado(nuevoEstado)

    startTransition(async () => {
      try {
        const result = await actualizarEstadoLaboral(nuevoEstado)
        if (result.ok) {
          toast.success(
            nuevoEstado === 'en_busqueda'
              ? 'Estado actualizado: en búsqueda laboral'
              : 'Estado actualizado: actualmente trabajando'
          )
        } else {
          setEstado(estadoAnterior)
          toast.error(result.error)
        }
      } catch {
        setEstado(estadoAnterior)
        toast.error('Error inesperado al actualizar el estado')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Badge de estado actual */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
          Estado actual:
        </span>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${estadoActual.badge}`}
        >
          <span>{estadoActual.badgeIcon}</span>
          {estadoActual.label}
          {isPending && (
            <LoaderCircle className="size-3 motion-safe:animate-spin ml-1" aria-hidden />
          )}
        </span>
      </div>

      {/* Selector de dos opciones */}
      <div className="flex flex-col sm:flex-row gap-3">
        {(Object.entries(ESTADOS) as [EstadoLaboral, typeof ESTADOS[EstadoLaboral]][]).map(
          ([key, info]) => {
            const Icon = info.icon
            const isActive = estado === key
            return (
              <button
                key={key}
                type="button"
                disabled={isPending}
                onClick={() => handleCambiar(key)}
                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  isActive ? info.bgActive : info.bgInactive
                }`}
              >
                <div
                  className={`shrink-0 p-1.5 rounded-lg ${
                    isActive ? 'bg-white/20' : 'bg-gray-100'
                  }`}
                >
                  <Icon
                    className={`size-4 ${isActive ? 'text-white' : 'text-gray-500'}`}
                    aria-hidden
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-bold leading-tight ${
                      isActive ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {info.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 leading-snug ${
                      isActive ? 'text-white/80' : 'text-gray-400'
                    }`}
                  >
                    {info.desc}
                  </p>
                </div>
                {isActive && (
                  <span className="ml-auto shrink-0 size-4 rounded-full bg-white/30 flex items-center justify-center">
                    <span className="size-2 rounded-full bg-white" />
                  </span>
                )}
              </button>
            )
          }
        )}
      </div>

      <p className="text-xs text-foreground-muted">
        Este estado es visible para los administradores del Portal de Empleo al revisar tu perfil y postulaciones.
      </p>
    </div>
  )
}
