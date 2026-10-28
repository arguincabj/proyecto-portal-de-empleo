'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Paginacion } from '@/components/ui/paginacion'
import { Search, Briefcase, Building2, Calendar, ArrowRight, LoaderCircle, AlertCircle } from 'lucide-react'

type Oferta = {
  id: string
  titulo: string
  empresa_nombre: string
  descripcion: string
  estado: string
  created_at: string
}

const ITEMS_POR_PAGINA = 15

export default function OfertasPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalidadFilter, setModalidadFilter] = useState('todas')
  const [paginaActual, setPaginaActual] = useState(1)

  useEffect(() => {
    async function fetchOfertas() {
      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from('ofertas')
          .select('*')
          .eq('estado', 'publicada')
          .order('created_at', { ascending: false })

        if (searchTerm.trim() !== '') {
          const term = `%${searchTerm.trim()}%`
          query = query.or(`titulo.ilike.${term},descripcion.ilike.${term},empresa_nombre.ilike.${term}`)
        }

        const { data, error: fetchError } = await query

        if (fetchError) {
          setError(fetchError.message || 'Error al consultar la base de datos de ofertas.')
          setOfertas([])
        } else {
          setOfertas(data ?? [])
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error inesperado al conectar con Supabase.'
        setError(errorMsg)
        setOfertas([])
      } finally {
        setLoading(false)
      }
    }

    fetchOfertas()
  }, [searchTerm])

  const filteredOfertas = ofertas.filter((oferta) => {
    if (modalidadFilter === 'todas') return true
    const content = `${oferta.titulo} ${oferta.descripcion}`.toLowerCase()
    return content.includes(modalidadFilter.toLowerCase())
  })

  const totalPaginas = Math.ceil(filteredOfertas.length / ITEMS_POR_PAGINA) || 1
  const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas)
  const inicio = (paginaValida - 1) * ITEMS_POR_PAGINA
  const fin = Math.min(inicio + ITEMS_POR_PAGINA, filteredOfertas.length)
  const ofertasVisibles = filteredOfertas.slice(inicio, fin)

  const manejarCambioPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header institucional en verde con letras blancas */}
      <div className="rounded-2xl bg-sidebar text-sidebar-foreground p-6 shadow-sm border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white border border-white/10">
              <Briefcase className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Portal de Ofertas Laborales
              </h1>
              <p className="mt-1 text-sm text-sidebar-muted">
                Explora las oportunidades laborales activas publicadas por las empresas de la ciudad.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-sidebar-muted hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-xl border border-white/15 transition-all self-start sm:self-auto"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="rounded-xl bg-surface p-4 shadow-card border border-border/60 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="size-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por palabra clave (título, descripción, empresa)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPaginaActual(1)
            }}
            className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={modalidadFilter}
            onChange={(e) => {
              setModalidadFilter(e.target.value)
              setPaginaActual(1)
            }}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
          >
            <option value="todas">Todas las modalidades</option>
            <option value="presencial">Presencial</option>
            <option value="remoto">Remoto</option>
            <option value="hibrido">Híbrido</option>
          </select>
        </div>
      </div>

      {/* Estado de Error */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-danger">Error al consultar las ofertas</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estado de Carga */}
      {loading && !error && (
        <div className="rounded-xl bg-surface p-12 shadow-card border border-border/60 text-center space-y-3">
          <LoaderCircle className="size-8 motion-safe:animate-spin text-primary-600 mx-auto" />
          <p className="text-sm font-medium text-foreground-secondary">Cargando ofertas de empleo...</p>
        </div>
      )}

      {/* Ausencia de Resultados */}
      {!loading && !error && filteredOfertas.length === 0 && (
        <div className="rounded-xl bg-surface p-12 shadow-card border border-border/60 text-center space-y-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary-50 text-primary-600 mx-auto">
            <Search className="size-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">No se encontraron ofertas</h3>
          <p className="text-sm text-foreground-secondary max-w-md mx-auto">
            {searchTerm || modalidadFilter !== 'todas'
              ? 'No hay ofertas que coincidan con la búsqueda o filtros aplicados. Intentá modificando los términos.'
              : 'Actualmente no hay ofertas laborales activas disponibles en el portal.'}
          </p>
        </div>
      )}

      {/* Lista de Ofertas */}
      {!loading && !error && filteredOfertas.length > 0 && (
        <>
          <div className="flex items-center justify-between text-xs font-semibold text-foreground-secondary px-1">
            <span>{filteredOfertas.length} {filteredOfertas.length === 1 ? 'oferta disponible' : 'ofertas disponibles'}</span>
            <span>Página {paginaValida} de {totalPaginas}</span>
          </div>

          <ul className="flex flex-col gap-4">
            {ofertasVisibles.map((oferta) => (
              <li
                key={oferta.id}
                className="rounded-xl bg-surface p-6 shadow-card hover:shadow-elevated transition-all border border-border/60 hover:border-primary-500/40 flex flex-col sm:flex-row justify-between gap-4"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/ofertas/${oferta.id}`}
                      className="font-bold text-lg text-foreground hover:text-primary-600 transition-colors"
                    >
                      {oferta.titulo}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-primary-600">
                    <Building2 className="size-4 shrink-0" />
                    <span>{oferta.empresa_nombre}</span>
                  </div>

                  <p className="text-sm text-foreground-secondary line-clamp-3 leading-relaxed">
                    {oferta.descripcion}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-foreground-muted pt-1">
                    <Calendar className="size-3.5" />
                    <span>Publicado el {new Date(oferta.created_at).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col justify-end items-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                  <Link
                    href={`/ofertas/${oferta.id}`}
                    className="inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-5 py-2.5 rounded-xl transition-all shadow-sm w-full sm:w-auto"
                  >
                    <span>Ver detalle</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {/* Paginación */}
          <Paginacion
            paginaActual={paginaValida}
            totalPaginas={totalPaginas}
            totalItems={filteredOfertas.length}
            itemsPorPagina={ITEMS_POR_PAGINA}
            nombreItems="ofertas"
            onCambiarPagina={manejarCambioPagina}
            className="rounded-xl bg-surface p-4 shadow-card border border-border/60"
          />
        </>
      )}
    </div>
  )
}
