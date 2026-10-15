'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, RotateCcw, Lock } from 'lucide-react'
import { moderarOferta } from './actions'

type Props = {
  ofertaId: string
  estadoActual: string
}

export function BotonModerarOferta({ ofertaId, estadoActual }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleCambio = (nuevoEstado: 'publicada' | 'rechazada' | 'cerrada' | 'pendiente', mensaje: string) => {
    startTransition(async () => {
      const res = await moderarOferta(ofertaId, nuevoEstado)
      if (res.ok) {
        toast.success(mensaje)
      } else {
        toast.error(res.error ?? 'Error al actualizar el estado de la oferta')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {estadoActual !== 'publicada' && (
        <button
          onClick={() => handleCambio('publicada', 'Oferta aprobada y publicada en el portal')}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm"
          title="Aprobar y publicar en el portal público"
        >
          <CheckCircle2 className="size-3.5" />
          <span>Aprobar</span>
        </button>
      )}

      {estadoActual !== 'rechazada' && estadoActual === 'pendiente' && (
        <button
          onClick={() => handleCambio('rechazada', 'Oferta rechazada')}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors disabled:opacity-50"
          title="Rechazar publicación de la oferta"
        >
          <XCircle className="size-3.5" />
          <span>Rechazar</span>
        </button>
      )}

      {estadoActual === 'publicada' && (
        <button
          onClick={() => handleCambio('cerrada', 'Oferta cerrada/finalizada')}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors disabled:opacity-50"
          title="Cerrar oferta para no recibir más postulaciones"
        >
          <Lock className="size-3.5" />
          <span>Cerrar</span>
        </button>
      )}

      {(estadoActual === 'cerrada' || estadoActual === 'rechazada') && (
        <button
          onClick={() => handleCambio('pendiente', 'Oferta vuelta a revisión')}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Revertir a estado pendiente"
        >
          <RotateCcw className="size-3.5" />
          <span>A revisión</span>
        </button>
      )}
    </div>
  )
}
