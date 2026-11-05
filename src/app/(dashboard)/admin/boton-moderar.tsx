'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, RotateCcw, Lock, AlertCircle } from 'lucide-react'
import { moderarOferta } from './actions'

type Props = {
  ofertaId: string
  estadoActual: string
}

export function BotonModerarOferta({ ofertaId, estadoActual }: Props) {
  const [isPending, startTransition] = useTransition()
  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const handleCambio = (
    nuevoEstado: 'publicada' | 'rechazada' | 'cerrada' | 'pendiente' | 'borrador',
    mensaje: string,
    motivo?: string
  ) => {
    startTransition(async () => {
      const res = await moderarOferta(ofertaId, nuevoEstado, motivo)
      if (res.ok) {
        toast.success(mensaje)
        setModalRechazoAbierto(false)
        setMotivoRechazo('')
      } else {
        toast.error(res.error ?? 'Error al actualizar el estado de la oferta')
      }
    })
  }

  const confirmarRechazo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!motivoRechazo.trim()) {
      toast.error('Por favor ingresá el motivo de las correcciones requeridas')
      return
    }
    handleCambio('rechazada', 'Oferta enviada como borrador a la empresa con las observaciones', motivoRechazo)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {estadoActual !== 'publicada' && (
          <button
            onClick={() => handleCambio('publicada', 'Oferta aprobada y publicada en el portal')}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
            title="Aprobar y publicar en el portal público"
          >
            <CheckCircle2 className="size-3.5" />
            <span>Aprobar</span>
          </button>
        )}

        {estadoActual === 'pendiente' && (
          <button
            onClick={() => setModalRechazoAbierto(true)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Solicitar cambios y devolver como borrador"
          >
            <XCircle className="size-3.5" />
            <span>Rechazar / Observar</span>
          </button>
        )}

        {estadoActual === 'publicada' && (
          <button
            onClick={() => handleCambio('cerrada', 'Oferta cerrada/finalizada')}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Cerrar oferta para no recibir más postulaciones"
          >
            <Lock className="size-3.5" />
            <span>Cerrar</span>
          </button>
        )}

        {(estadoActual === 'cerrada' || estadoActual === 'rechazada' || estadoActual === 'borrador') && (
          <button
            onClick={() => handleCambio('pendiente', 'Oferta vuelta a revisión')}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
            title="Revertir a estado pendiente de revisión"
          >
            <RotateCcw className="size-3.5" />
            <span>A revisión</span>
          </button>
        )}
      </div>

      {/* Modal para ingresar el motivo de rechazo/observación */}
      {modalRechazoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Rechazar oferta laboral</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  La oferta pasará a <strong>Borrador</strong> para que la empresa pueda modificar exactamente lo que indiques y volver a enviarla.
                </p>
              </div>
            </div>

            <form onSubmit={confirmarRechazo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Motivo / Cambios solicitados <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ej: Por favor ajustar la descripción del puesto y verificar la modalidad de trabajo especificada..."
                  className="w-full text-sm rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-gray-800 placeholder:text-gray-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalRechazoAbierto(false)
                    setMotivoRechazo('')
                  }}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !motivoRechazo.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {isPending ? 'Guardando...' : 'Rechazar y enviar a borrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
