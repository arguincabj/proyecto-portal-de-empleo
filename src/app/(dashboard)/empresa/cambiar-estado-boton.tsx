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

  const handleToggle = () => {
    const nuevoEstado = estadoActual === 'publicada' ? 'cerrada' : 'publicada'
    startTransition(async () => {
      const res = await cambiarEstadoOferta(ofertaId, nuevoEstado)
      if (res.ok) {
        toast.success(
          nuevoEstado === 'publicada'
            ? 'Oferta publicada y visible en el portal.'
            : 'Oferta cerrada/pausada con éxito.'
        )
      } else {
        toast.error(res.error ?? 'No se pudo cambiar el estado de la oferta.')
      }
    })
  }

  if (estadoActual === 'publicada') {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? 'Actualizando...' : 'Cerrar oferta'}
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
    >
      {isPending ? 'Actualizando...' : 'Publicar / Activar'}
    </button>
  )
}
