'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, X, Briefcase, Search } from 'lucide-react'
import { CATEGORIAS_LABORALES } from '@/constants/categorias-laborales'

interface MultiSelectCategoriasProps {
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
}

export function MultiSelectCategorias({
  selected,
  onChange,
  disabled = false,
}: MultiSelectCategoriasProps) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtradas = CATEGORIAS_LABORALES.filter((cat) =>
    cat.toLowerCase().includes(busqueda.toLowerCase().trim())
  )

  const toggleCategoria = (cat: string) => {
    if (selected.includes(cat)) {
      onChange(selected.filter((item) => item !== cat))
    } else {
      onChange([...selected, cat])
    }
  }

  const removeCategoria = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((item) => item !== cat))
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Botón trigger */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        onClick={() => {
          if (!disabled) setOpen(!open)
        }}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(!open)
          }
        }}
        className={`min-h-[44px] w-full cursor-pointer rounded-xl border border-input bg-background p-2 text-sm transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 ${
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.length === 0 ? (
            <span className="px-1 text-muted-foreground">
              Seleccioná una o más categorías laborales...
            </span>
          ) : (
            selected.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60"
              >
                <Briefcase className="size-3 shrink-0 text-primary-600 dark:text-primary-400" />
                <span>{cat}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => removeCategoria(cat, e)}
                    className="ml-0.5 rounded p-0.5 hover:bg-primary-200/60 hover:text-primary-900 focus:outline-none"
                    aria-label={`Quitar ${cat}`}
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            ))
          )}
          <span className="ml-auto pr-1 text-muted-foreground shrink-0">
            <ChevronsUpDown className="size-4 opacity-50" />
          </span>
        </div>
      </div>

      {/* Menú desplegable */}
      {open && (
        <div className="absolute z-50 mt-1 max-h-96 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95">
          {/* Buscador dentro del combo box */}
          <div className="flex items-center border-b border-border px-3 py-2 bg-muted/30">
            <Search className="size-4 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar categoría..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Opciones */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
            {filtradas.length === 0 ? (
              <p className="p-3 text-center text-xs text-muted-foreground">
                No se encontraron categorías con &quot;{busqueda}&quot;
              </p>
            ) : (
              filtradas.map((cat) => {
                const isSelected = selected.includes(cat)
                return (
                  <div
                    key={cat}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => toggleCategoria(cat)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleCategoria(cat)
                      }
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary-50 text-primary-900 font-medium dark:bg-primary-950/70 dark:text-primary-200'
                        : 'text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex size-4 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-muted-foreground/40 bg-background'
                        }`}
                      >
                        {isSelected && <Check className="size-3 text-white" strokeWidth={3} />}
                      </div>
                      <span>{cat}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pie de selección */}
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground bg-muted/20">
            <span>{selected.length} seleccionada{selected.length === 1 ? '' : 's'}</span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-danger hover:underline"
              >
                Desmarcar todas
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
