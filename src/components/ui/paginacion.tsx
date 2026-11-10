'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginacionProps = {
  paginaActual: number
  totalPaginas: number
  onCambiarPagina?: (pagina: number) => void
  crearHref?: (pagina: number) => string
  totalItems?: number
  itemsPorPagina?: number
  nombreItems?: string
  className?: string
}

export function Paginacion({
  paginaActual,
  totalPaginas,
  onCambiarPagina,
  crearHref,
  totalItems,
  itemsPorPagina = 15,
  nombreItems = 'elementos',
  className = 'p-4 bg-gray-50/60 border-t border-gray-100',
}: PaginacionProps) {
  if (totalPaginas <= 1 && (!totalItems || totalItems <= itemsPorPagina)) {
    if (totalItems !== undefined && totalItems > 0) {
      return (
        <div className={`${className} flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500`}>
          <p>
            Mostrando <span className="font-semibold text-gray-800">1</span> a{' '}
            <span className="font-semibold text-gray-800">{totalItems}</span> de{' '}
            <span className="font-semibold text-gray-800">{totalItems}</span> {nombreItems}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-lg text-gray-300 cursor-not-allowed"
            >
              <ChevronLeft className="size-4 mr-0.5" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 text-xs font-semibold rounded-lg bg-teal-600 text-white shadow-xs">
              1
            </span>
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-lg text-gray-300 cursor-not-allowed"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="size-4 ml-0.5" />
            </button>
          </div>
        </div>
      )
    }
    return null
  }

  const inicio = (paginaActual - 1) * itemsPorPagina + 1
  const fin = totalItems !== undefined ? Math.min(paginaActual * itemsPorPagina, totalItems) : paginaActual * itemsPorPagina

  // Generar páginas a mostrar
  const generarPaginas = () => {
    const paginas: (number | string)[] = []
    const delta = 1 // Número de páginas visibles adyacentes a la página activa

    for (let i = 1; i <= totalPaginas; i++) {
      if (
        i === 1 ||
        i === totalPaginas ||
        (i >= paginaActual - delta && i <= paginaActual + delta)
      ) {
        paginas.push(i)
      } else if (
        paginas[paginas.length - 1] !== '...' &&
        (i < paginaActual - delta || i > paginaActual + delta)
      ) {
        paginas.push('...')
      }
    }

    return paginas
  }

  const paginas = generarPaginas()

  const renderBoton = (
    pagina: number,
    contenido: React.ReactNode,
    deshabilitado: boolean,
    esActivo: boolean = false,
    key?: string | number
  ) => {
    const baseClasses = `relative inline-flex items-center justify-center text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
      esActivo
        ? 'bg-teal-600 text-white shadow-xs'
        : deshabilitado
        ? 'text-gray-300 cursor-not-allowed'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`

    if (crearHref && !deshabilitado && !esActivo) {
      return (
        <Link
          key={key ?? pagina}
          href={crearHref(pagina)}
          className={`${baseClasses} min-w-8 h-8 px-2`}
        >
          {contenido}
        </Link>
      )
    }

    return (
      <button
        key={key ?? pagina}
        type="button"
        disabled={deshabilitado}
        onClick={() => !deshabilitado && onCambiarPagina?.(pagina)}
        className={`${baseClasses} min-w-8 h-8 px-2`}
      >
        {contenido}
      </button>
    )
  }

  return (
    <div className={`${className} flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500`}>
      {/* Texto informativo */}
      <div>
        {totalItems !== undefined ? (
          <p>
            Mostrando <span className="font-semibold text-gray-800">{inicio}</span> a{' '}
            <span className="font-semibold text-gray-800">{fin}</span> de{' '}
            <span className="font-semibold text-gray-800">{totalItems}</span> {nombreItems}
          </p>
        ) : (
          <p>
            Página <span className="font-semibold text-gray-800">{paginaActual}</span> de{' '}
            <span className="font-semibold text-gray-800">{totalPaginas}</span>
          </p>
        )}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-1">
        {/* Botón Anterior */}
        {renderBoton(
          paginaActual - 1,
          <>
            <ChevronLeft className="size-4 mr-0.5" />
            <span className="hidden sm:inline">Anterior</span>
          </>,
          paginaActual <= 1,
          false,
          'prev'
        )}

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {paginas.map((p, index) => {
            if (p === '...') {
              return (
                <span key={`dots-${index}`} className="px-2 py-1 text-gray-400 select-none">
                  ...
                </span>
              )
            }

            const numPagina = p as number
            const esActiva = numPagina === paginaActual

            return renderBoton(
              numPagina,
              numPagina,
              false,
              esActiva,
              `page-${numPagina}`
            )
          })}
        </div>

        {/* Botón Siguiente */}
        {renderBoton(
          paginaActual + 1,
          <>
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="size-4 ml-0.5" />
          </>,
          paginaActual >= totalPaginas,
          false,
          'next'
        )}
      </div>
    </div>
  )
}
