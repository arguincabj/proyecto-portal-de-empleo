'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, ChevronDown } from 'lucide-react'
import { BotonModerarOferta } from './boton-moderar'

const ESTADO_BADGE: Record<string, { label: string; class: string }> = {
  publicada: { label: 'Publicada', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pendiente: { label: 'Pendiente de revisión', class: 'bg-amber-50 text-amber-700 border-amber-200 font-bold' },
  cerrada: { label: 'Cerrada', class: 'bg-gray-100 text-gray-600 border-gray-200' },
  rechazada: { label: 'Rechazada', class: 'bg-red-50 text-red-700 border-red-200' },
}

export type OfertaAdminItem = {
  id: string
  titulo: string
  empresa_nombre: string | null
  descripcion: string
  estado: string
  created_at: string
  postulaciones?: { count: number }[] | null
}

type Props = {
  ofertas: OfertaAdminItem[]
}

const PASO_PAGINACION = 15

export function ListaOfertasAdmin({ ofertas }: Props) {
  const [limite, setLimite] = useState(PASO_PAGINACION)

  if (ofertas.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        <Briefcase className="size-10 text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-700">No hay ofertas registradas aún</p>
        <p className="text-xs text-gray-400 mt-1">
          Cuando las empresas envíen ofertas laborales, aparecerán aquí para su moderación.
        </p>
      </div>
    )
  }

  const ofertasVisibles = ofertas.slice(0, limite)
  const hayMas = limite < ofertas.length
  const restantes = ofertas.length - limite

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {ofertasVisibles.map((oferta) => {
          const cantPostulaciones = oferta.postulaciones?.[0]?.count ?? 0
          const badge = ESTADO_BADGE[oferta.estado] ?? {
            label: oferta.estado,
            class: 'bg-gray-100 text-gray-600 border-gray-200',
          }
          const isPendiente = oferta.estado === 'pendiente'

          return (
            <div
              key={oferta.id}
              className={`p-6 transition-colors hover:bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isPendiente ? 'bg-amber-50/30' : ''
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/ofertas/${oferta.id}`}
                    className="font-bold text-base text-gray-900 hover:text-teal-700 transition-colors"
                  >
                    {oferta.titulo}
                  </Link>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${badge.class}`}>
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs font-semibold text-teal-800">
                  Empresa: {oferta.empresa_nombre || 'Sin especificar'}
                </p>

                <p className="text-xs text-gray-500 line-clamp-2">{oferta.descripcion}</p>

                <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 font-mono">
                  <span>Cargada: {new Date(oferta.created_at).toLocaleDateString('es-AR')}</span>
                  <span>👥 {cantPostulaciones} postulaciones</span>
                </div>
              </div>

              {/* Acciones de Moderación */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <BotonModerarOferta ofertaId={oferta.id} estadoActual={oferta.estado} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Pie de lista con paginación */}
      <div className="p-4 bg-gray-50/60 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Mostrando <span className="font-semibold text-gray-800">{ofertasVisibles.length}</span> de{' '}
          <span className="font-semibold text-gray-800">{ofertas.length}</span> ofertas
        </p>

        {hayMas ? (
          <button
            type="button"
            onClick={() => setLimite((prev) => prev + PASO_PAGINACION)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-sm"
          >
            <span>Cargar más ofertas ({Math.min(PASO_PAGINACION, restantes)} más)</span>
            <ChevronDown className="size-3.5" />
          </button>
        ) : (
          ofertas.length > PASO_PAGINACION && (
            <span className="text-xs text-gray-400 font-medium">Se mostraron todas las ofertas registradas</span>
          )
        )}
      </div>
    </div>
  )
}
