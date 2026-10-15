'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, RotateCcw, MessageSquare, LoaderCircle } from 'lucide-react'
import { moderarEmpresa } from './actions'

type Props = {
  empresaId: string
  estadoActual: string
  motivoActual?: string | null
}

export function BotonModerarEmpresa({ empresaId, estadoActual, motivoActual }: Props) {
  const [isPending, startTransition] = useTransition()
  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false)
  const [motivo, setMotivo] = useState(motivoActual ?? '')

  const handleCambio = (
    nuevoEstado: 'aprobada' | 'rechazada' | 'pendiente',
    mensaje: string,
    motivoTexto?: string
  ) => {
    startTransition(async () => {
      const res = await moderarEmpresa(empresaId, nuevoEstado, motivoTexto)
      if (res.ok) {
        toast.success(mensaje)
        setModalRechazoAbierto(false)
      } else {
        toast.error(res.error ?? 'Error al actualizar el estado de la empresa')
      }
    })
  }

  const confirmarRechazo = () => {
    handleCambio('rechazada', 'Empresa rechazada con comentario', motivo)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {estadoActual !== 'aprobada' && (
          <button
            onClick={() => handleCambio('aprobada', 'Empresa aprobada correctamente')}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm"
            title="Aprobar perfil de empresa"
          >
            <CheckCircle2 className="size-3.5" />
            <span>Aprobar</span>
          </button>
        )}

        {estadoActual !== 'rechazada' && (
          <button
            onClick={() => setModalRechazoAbierto(true)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors disabled:opacity-50"
            title="Rechazar perfil con explicación"
          >
            <XCircle className="size-3.5" />
            <span>Rechazar</span>
          </button>
        )}

        {estadoActual === 'rechazada' && (
          <button
            onClick={() => setModalRechazoAbierto(true)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
            title="Modificar motivo de rechazo"
          >
            <MessageSquare className="size-3.5" />
            <span>Editar motivo</span>
          </button>
        )}

        {(estadoActual === 'rechazada' || estadoActual === 'aprobada') && (
          <button
            onClick={() => handleCambio('pendiente', 'Empresa vuelta a revisión')}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Volver a estado pendiente"
          >
            <RotateCcw className="size-3.5" />
            <span>A revisión</span>
          </button>
        )}
      </div>

      {/* Modal / Diálogo para ingresar el motivo del rechazo */}
      {modalRechazoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <XCircle className="size-5" />
                <h3 className="font-bold text-gray-900 text-base">Rechazar perfil de empresa</h3>
              </div>
              <p className="text-xs text-gray-500">
                Escribí un comentario explicándole a la empresa qué datos debe corregir o por qué no fue aprobada.
                La empresa verá este mensaje cuando ingrese a su perfil.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="motivo-rechazo" className="block text-xs font-semibold text-gray-700">
                Motivo / Explicación del rechazo
              </label>
              <textarea
                id="motivo-rechazo"
                rows={4}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: El CUIT ingresado no coincide con la Razón Social declarada en AFIP. Por favor corregirlo y reenviar."
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalRechazoAbierto(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRechazo}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 shadow-sm"
              >
                {isPending ? (
                  <>
                    <LoaderCircle className="size-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Confirmar rechazo</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
