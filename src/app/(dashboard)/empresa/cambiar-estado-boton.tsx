'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { cambiarEstadoOferta } from './actions'

interface CambiarEstadoBotonProps {
  ofertaId: string
  estadoActual: string
}

export function CambiarEstadoBoton({ ofertaId, estadoActual }: CambiarEstadoBotonProps) {
  const [isPending, startTransition] = useTransition()

  const handleCerrar = () => {
    startTransition(async () => {
      const res = await cambiarEstadoOferta(ofertaId, 'cerrada')
      if (res.ok) {
        toast.success('Oferta finalizada/cerrada con éxito.')
      } else {
        toast.error(res.error ?? 'No se pudo cerrar la oferta.')
      }
    })
  }

  // Si la oferta está publicada, la empresa puede darla de baja / cerrarla
  if (estadoActual === 'publicada') {
    return (
      <button
        onClick={handleCerrar}
        disabled={isPending}
        className="text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        title="Finalizar búsqueda laboral"
      >
        {isPending ? 'Cerrando...' : 'Cerrar oferta'}
      </button>
    )
  }

  // Si está pendiente, informar que espera aprobación
  if (estadoActual === 'pendiente') {
    return (
      <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-medium cursor-default">
        En revisión
      </span>
    )
  }

  // Si está cerrada o rechazada
  return (
    <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 border border-gray-200 font-medium cursor-default">
      {estadoActual === 'cerrada' ? 'Finalizada' : estadoActual}
    </span>
  )
}
