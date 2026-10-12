'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { postularAOferta } from '../actions'

interface BotonPostularProps {
  ofertaId: string
  isAuthenticated: boolean
  userRole: string | null
  yaPostulado: boolean
  estadoPostulacion?: string | null
}

const ESTADOS_MAP: Record<string, { label: string; class: string }> = {
  recibida: { label: 'Recibida', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  en_revision: { label: 'En revisión', class: 'bg-amber-100 text-amber-800 border-amber-200' },
  derivada: { label: 'Derivada a la empresa', class: 'bg-purple-100 text-purple-800 border-purple-200' },
  rechazada_municipalidad: { label: 'No seleccionada', class: 'bg-red-100 text-red-800 border-red-200' },
}

export function BotonPostular({
  ofertaId,
  isAuthenticated,
  userRole,
  yaPostulado: initialYaPostulado,
  estadoPostulacion,
}: BotonPostularProps) {
  const [yaPostulado, setYaPostulado] = useState(initialYaPostulado)
  const [isPending, startTransition] = useTransition()

  if (!isAuthenticated) {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center space-y-3">
        <h4 className="font-semibold text-teal-900 text-base">¿Te interesa esta oportunidad?</h4>
        <p className="text-sm text-teal-800 max-w-md mx-auto">
          Iniciá sesión o creá tu cuenta de postulante para enviar tu CV y postularte con un solo clic.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            href={`/auth/login?redirect=/ofertas/${ofertaId}`}
            className="bg-teal-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl hover:bg-teal-800 transition-colors shadow-sm"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/registro"
            className="bg-white text-teal-700 font-medium text-sm px-6 py-2.5 rounded-xl border border-teal-300 hover:bg-teal-50 transition-colors"
          >
            Registrarme como postulante
          </Link>
        </div>
      </div>
    )
  }

  if (userRole !== 'postulante') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center text-sm text-gray-600">
        Estás conectado con una cuenta de <strong className="capitalize">{userRole}</strong>. Las postulaciones a ofertas están reservadas para usuarios con cuenta de postulante.
      </div>
    )
  }

  if (yaPostulado) {
    const estadoInfo = estadoPostulacion ? ESTADOS_MAP[estadoPostulacion] : null
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h4 className="font-semibold text-emerald-900 text-base">Ya te has postulado a este puesto</h4>
            <p className="text-sm text-emerald-800">
              Tu postulación fue registrada en el sistema de empleo municipal.
            </p>
          </div>
        </div>
        {estadoInfo && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-700 font-medium">Estado:</span>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${estadoInfo.class}`}>
              {estadoInfo.label}
            </span>
          </div>
        )}
      </div>
    )
  }

  const handlePostular = () => {
    startTransition(async () => {
      const result = await postularAOferta(ofertaId)
      if (result.ok) {
        setYaPostulado(true)
        toast.success('¡Postulación enviada con éxito!')
      } else {
        toast.error(result.error ?? 'No se pudo enviar la postulación.')
      }
    })
  }

  return (
    <div className="bg-white border border-teal-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h4 className="font-bold text-gray-900 text-lg">¿Cumplís con los requisitos?</h4>
        <p className="text-sm text-gray-500 mt-0.5">
          Tu perfil y CV serán enviados a la Oficina de Empleo para su revisión.
        </p>
      </div>

      <button
        onClick={handlePostular}
        disabled={isPending}
        className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            <span>Enviando...</span>
          </>
        ) : (
          <span>Postularme ahora</span>
        )}
      </button>
    </div>
  )
}
