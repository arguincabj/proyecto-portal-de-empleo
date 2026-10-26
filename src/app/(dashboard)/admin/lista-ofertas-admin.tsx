'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Briefcase, Users } from 'lucide-react'
import { BotonModerarOferta } from './boton-moderar'
import { Paginacion } from '@/components/ui/paginacion'

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

const ITEMS_POR_PAGINA = 15

export function ListaOfertasAdmin({ ofertas }: Props) {
  const [paginaActual, setPaginaActual] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const totalPaginas = Math.ceil(ofertas.length / ITEMS_POR_PAGINA) || 1
  const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas)
  const inicio = (paginaValida - 1) * ITEMS_POR_PAGINA
  const fin = Math.min(inicio + ITEMS_POR_PAGINA, ofertas.length)
  const ofertasVisibles = ofertas.slice(inicio, fin)

  const manejarCambioPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina)
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div ref={containerRef}>
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
                  <Link
                    href={`/admin/postulantes?oferta=${oferta.id}`}
                    className="hover:text-teal-700 hover:underline transition-colors flex items-center gap-1 font-semibold text-teal-800"
                    title="Ir a gestionar postulantes de esta oferta"
                  >
                    👥 {cantPostulaciones} {cantPostulaciones === 1 ? 'postulación' : 'postulaciones'}
                  </Link>
                </div>
              </div>

              {/* Acciones de Moderación y Postulantes */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <Link
                  href={`/admin/postulantes?oferta=${oferta.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors shadow-2xs"
                  title="Gestionar postulantes de esta oferta"
                >
                  <Users className="size-3.5" />
                  <span>Postulantes ({cantPostulaciones})</span>
                </Link>
                <BotonModerarOferta ofertaId={oferta.id} estadoActual={oferta.estado} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Pie de lista con paginación */}
      <Paginacion
        paginaActual={paginaValida}
        totalPaginas={totalPaginas}
        totalItems={ofertas.length}
        itemsPorPagina={ITEMS_POR_PAGINA}
        nombreItems="ofertas"
        onCambiarPagina={manejarCambioPagina}
      />
    </div>
  )
}
