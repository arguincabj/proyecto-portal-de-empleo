'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Camera, MapPin, ExternalLink } from 'lucide-react'

interface CiudadFoto {
  src: string
  titulo: string
  lugar: string
  descripcion: string
}

const FOTOS_FUNES: CiudadFoto[] = [
  {
    src: '/images/funes/lapachos-yrigoyen.jpg',
    titulo: 'Lapachos Rosados en Flor',
    lugar: 'Avenida Yrigoyen · Funes',
    descripcion: 'El icónico túnel de lapachos florecidos que viste de primavera a nuestra ciudad.',
  },
  {
    src: '/images/funes/municipalidad.jpg',
    titulo: 'Edificio Municipal',
    lugar: 'Sede de Gobierno · Funes',
    descripcion: 'Punto neurálgico de la gestión pública y atención ciudadana de Funes.',
  },
  {
    src: '/images/funes/paseo-de-la-estacion.jpg',
    titulo: 'Paseo de la Estación',
    lugar: 'Centro Cívico y Cultural',
    descripcion: 'Espacio de recreación, eventos culturales y encuentros gastronómicos.',
  },
  {
    src: '/images/funes/estacion-funes.jpg',
    titulo: 'Histórica Estación de Tren',
    lugar: 'Patrimonio Ferroviario',
    descripcion: 'Identidad y origen histórico de nuestra ciudad jardín.',
  },
  {
    src: '/images/funes/plaza-san-jose.jpg',
    titulo: 'Plaza San José',
    lugar: 'Casco Céntrico',
    descripcion: 'Plaza arbolada, juegos infantiles y corazón social de la comunidad.',
  },
  {
    src: '/images/funes/biblioteca-jose-hernandez.jpg',
    titulo: 'Biblioteca Popular José Hernández',
    lugar: 'Espacio de Lectura y Saber',
    descripcion: 'Promoción del conocimiento, talleres y desarrollo educativo local.',
  },
]

export function FunesCiudadCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Cambio automático suave cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FOTOS_FUNES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const fotoActual = FOTOS_FUNES[currentIndex]

  const prev = () => {
    setCurrentIndex((prev) => (prev === 0 ? FOTOS_FUNES.length - 1 : prev - 1))
  }

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % FOTOS_FUNES.length)
  }

  return (
    <div className="w-full bg-gradient-to-b from-white to-gray-50/60 rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
      {/* Cabecera de la sección con estilo armónico y sutil */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider border border-emerald-200/60">
            <MapPin className="size-3.5 text-emerald-600" />
            <span>El Jardín de la Provincia</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-2 tracking-tight">
            Descubrí la Ciudad de Funes
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
            Un recorrido fotográfico por los rincones emblemáticos, espacios verdes y puntos de encuentro de nuestra ciudad.
          </p>
        </div>

        {/* Card sutil y llamativa de Instagram Oficial */}
        <div className="shrink-0">
          <a
            href="https://www.instagram.com/gobiernodefunes/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-3.5 px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 hover:from-pink-500/15 hover:via-purple-500/15 hover:to-amber-500/15 border border-pink-200/60 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02]"
            title="Ir a Instagram oficial del Gobierno de Funes"
          >
            <div className="size-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-700">
                  Instagram Oficial
                </span>
                <ExternalLink className="size-3 text-pink-600 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs font-extrabold text-gray-800 tracking-tight">
                @gobiernodefunes
              </p>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Novedades y actualidad en vivo
              </p>
            </div>
          </a>
        </div>
      </div>

      {/* Visor Carrusel Fotográfico */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200/70 bg-gray-900 group aspect-[16/9] sm:aspect-[21/9] max-h-[380px]">
        {/* Imagen actual con Next.js Image */}
        <div className="relative w-full h-full">
          <Image
            src={fotoActual.src}
            alt={fotoActual.titulo}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover transition-opacity duration-700"
            priority={false}
          />

          {/* Gradientes oscuros para garantizar legibilidad de textos */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30 pointer-events-none" />
        </div>

        {/* Información superpuesta sobre la foto */}
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 text-white z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-none">
          <div className="space-y-1 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[11px] font-semibold text-emerald-200 border border-white/20">
              <MapPin className="size-3 text-emerald-300" />
              {fotoActual.lugar}
            </span>
            <h4 className="text-lg sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
              {fotoActual.titulo}
            </h4>
            <p className="text-xs sm:text-sm text-gray-200/90 leading-relaxed line-clamp-2">
              {fotoActual.descripcion}
            </p>
          </div>

          {/* Contador de fotos */}
          <div className="shrink-0 flex items-center gap-1.5 text-xs font-mono font-bold bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 self-start sm:self-auto">
            <Camera className="size-3.5 text-emerald-300" />
            <span>{currentIndex + 1}</span>
            <span className="text-white/50">/</span>
            <span>{FOTOS_FUNES.length}</span>
          </div>
        </div>

        {/* Botones de navegación Anterior / Siguiente */}
        <button
          onClick={prev}
          aria-label="Foto anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 size-9 sm:size-10 rounded-full bg-white/80 hover:bg-white text-gray-800 backdrop-blur-md flex items-center justify-center shadow-md transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:scale-105 z-20 cursor-pointer"
        >
          <ChevronLeft className="size-5" />
        </button>

        <button
          onClick={next}
          aria-label="Foto siguiente"
          className="absolute right-3 top-1/2 -translate-y-1/2 size-9 sm:size-10 rounded-full bg-white/80 hover:bg-white text-gray-800 backdrop-blur-md flex items-center justify-center shadow-md transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:scale-105 z-20 cursor-pointer"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Indicadores inferiores (Pills / Dots interactivos) */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {FOTOS_FUNES.map((foto, index) => (
          <button
            key={foto.src}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Ir a foto ${index + 1}: ${foto.titulo}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              index === currentIndex
                ? 'w-7 h-2 bg-emerald-600'
                : 'size-2 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
