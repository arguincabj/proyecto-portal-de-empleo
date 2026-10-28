'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Briefcase, MapPin, Building2, ArrowRight } from 'lucide-react'

export type OfertaSlide = {
  id: string
  titulo: string
  empresa_nombre: string
  descripcion: string
  modalidad?: string | null
  created_at: string
}

export function OfertasCarousel({ ofertas }: { ofertas: OfertaSlide[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-avance suave cada 5 segundos
  useEffect(() => {
    if (ofertas.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ofertas.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [ofertas.length])

  if (!ofertas || ofertas.length === 0) {
    return (
      <div className="h-[270px] bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-white flex flex-col items-center justify-center text-center">
        <Briefcase className="size-8 mx-auto mb-2 text-white/70" />
        <p className="text-sm font-semibold">No hay ofertas activas en este momento</p>
        <p className="text-xs text-white/70 mt-1">Pronto se publicarán nuevas oportunidades laborales.</p>
      </div>
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? ofertas.length - 1 : prev - 1))
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % ofertas.length)
  }

  const oferta = ofertas[currentIndex]

  return (
    <div className="relative group w-full">
      {/* Contenedor relativo para la tarjeta y sus botones de navegación */}
      <div className="relative">
        {/* Tarjeta del Carrusel con altura fija para evitar saltos al pasar de oferta */}
        <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-white/30 p-6 sm:p-7 shadow-xl h-[270px] flex flex-col justify-between transition-all duration-300">
          <div key={oferta.id} className="flex flex-col h-full justify-between">
            {/* Cabecera de la tarjeta: Badge e Indicador numérico */}
            <div className="flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="size-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
                  <Briefcase className="size-4" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50/80 px-2.5 py-0.5 rounded-full border border-teal-200/50">
                  Oferta Destacada
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono shrink-0">
                <span>{currentIndex + 1}</span>
                <span>/</span>
                <span>{ofertas.length}</span>
              </div>
            </div>

            {/* Cuerpo central: Título, Empresa/Ubicación y Descripción */}
            <div className="my-auto py-2">
              <h3
                className="text-lg sm:text-xl font-bold text-gray-900 leading-snug line-clamp-1"
                title={oferta.titulo}
              >
                {oferta.titulo}
              </h3>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="size-3.5 text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-800 truncate" title={oferta.empresa_nombre}>
                    {oferta.empresa_nombre}
                  </span>
                </div>
                <span className="text-gray-300 shrink-0">·</span>
                <div className="flex items-center gap-1 shrink-0">
                  <MapPin className="size-3.5 text-gray-400 shrink-0" />
                  <span>Funes, Santa Fe</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed mt-2.5">
                {oferta.descripcion}
              </p>
            </div>

            {/* Pie de tarjeta con fecha y botón a la oferta */}
            <div className="flex items-center justify-between pt-3.5 border-t border-gray-100 shrink-0">
              <span className="text-[11px] font-mono text-gray-400">
                Publicado: {new Date(oferta.created_at).toLocaleDateString('es-AR')}
              </span>

              <Link
                href={`/ofertas/${oferta.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors hover:underline"
              >
                <span>Ver detalles y postularme</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Flechas de navegación centradas respecto a la tarjeta */}
        {ofertas.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Oferta anterior"
              className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-10 size-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all focus:outline-none"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Oferta siguiente"
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 size-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all focus:outline-none"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Indicadores de bolitas */}
      {ofertas.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-3">
          {ofertas.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === idx ? 'w-6 bg-teal-300' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Ir a la oferta ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
