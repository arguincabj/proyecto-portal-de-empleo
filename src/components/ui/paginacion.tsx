'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginacionProps = {
  paginaActual: number
  totalPaginas: number
  onCambiarPagina: (pagina: number) => void
  totalItems?: number
  itemsPorPagina?: number
  nombreItems?: string
  className?: string
}

export function Paginacion({
  paginaActual,
  totalPaginas,
  onCambiarPagina,
  totalItems,
  itemsPorPagina = 15,
  nombreItems = 'elementos',
  className = 'p-4 bg-gray-50/60 border-t border-gray-100',
}: PaginacionProps) {
  if (totalPaginas <= 1 && (!totalItems || totalItems <= itemsPorPagina)) {
    if (totalItems !== undefined && totalItems > 0) {
      return (
        <div className={`${className} flex items-center justify-between text-xs text-gray-500`}>
          <p>
            Mostrando <span className="font-semibold text-gray-800">{totalItems}</span> de{' '}
            <span className="font-semibold text-gray-800">{totalItems}</span> {nombreItems}
          </p>
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
      } else if (paginas[paginas.length - 1] !== '...') {
        paginas.push('...')
      }
    }

    return paginas
  }

  const paginas = generarPaginas()

  return (
    <div className={`${className} flex flex-col sm:flex-row items-center justify-between gap-4`}>
      {totalItems !== undefined ? (
        <p className="text-xs text-gray-500 order-2 sm:order-1">
          Mostrando <span className="font-semibold text-gray-800">{inicio}</span> a{' '}
          <span className="font-semibold text-gray-800">{fin}</span> de{' '}
          <span className="font-semibold text-gray-800">{totalItems}</span> {nombreItems}
        </p>
      ) : (
        <p className="text-xs text-gray-500 order-2 sm:order-1">
          Página <span className="font-semibold text-gray-800">{paginaActual}</span> de{' '}
          <span className="font-semibold text-gray-800">{totalPaginas}</span>
        </p>
      )}

      <div className="inline-flex items-center gap-1 order-1 sm:order-2">
        <button
          type="button"
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual <= 1}
          aria-label="Página anterior"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-1 mx-1">
          {paginas.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-gray-400 select-none">
                  ...
                </span>
              )
            }

            const numPagina = p as number
            const esActual = numPagina === paginaActual
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onCambiarPagina(numPagina)}
                aria-current={esActual ? 'page' : undefined}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors ${
                  esActual
                    ? 'bg-teal-600 text-white font-bold shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-teal-700'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual >= totalPaginas}
          aria-label="Página siguiente"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
