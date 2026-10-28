'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Paginacion } from '@/components/ui/paginacion'

type Oferta = {
  id: string
  titulo: string
  empresa_nombre: string
  descripcion: string
  estado: string
  created_at: string
}

const ESTADO_COLOR: Record<string, string> = {
  publicada: 'bg-green-100 text-green-700 border-green-200',
  cerrada: 'bg-gray-100 text-gray-500 border-gray-200',
  pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  rechazada: 'bg-red-100 text-red-600 border-red-200',
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
    <main className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-sidebar text-sidebar-foreground p-6 rounded-2xl shadow-sm border border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Portal de Ofertas Laborales</h1>
            <p className="text-sm text-sidebar-muted mt-1">
              Explora las oportunidades laborales activas publicadas por las empresas de la ciudad.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-sidebar-muted hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-xl border border-white/15 transition-all"
          >
            ← Volver al inicio
          </Link>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por palabra clave (título, descripción, empresa)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPaginaActual(1)
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={modalidadFilter}
              onChange={(e) => {
                setModalidadFilter(e.target.value)
                setPaginaActual(1)
              }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50 text-gray-700"
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
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-900">Error al consultar las ofertas</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-xs text-red-600 mt-2 font-mono">
                  Sugerencia: Revisa las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Estado de Carga */}
        {loading && !error && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-600 border-t-transparent"></div>
            <p className="text-gray-500 text-sm font-medium">Cargando ofertas de empleo...</p>
          </div>
        )}

        {/* Ausencia de Resultados */}
        {!loading && !error && filteredOfertas.length === 0 && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center space-y-2">
            <span className="text-4xl block">🔍</span>
            <h3 className="font-semibold text-gray-800 text-lg">No se encontraron ofertas</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              {searchTerm || modalidadFilter !== 'todas'
                ? 'No hay ofertas publicadas que coincidan con los filtros aplicados. Intenta modificar la búsqueda.'
                : 'Actualmente no hay ofertas laborales activas disponibles.'}
            </p>
          </div>
        )}

        {/* Lista de Ofertas — solo lectura pública */}
        {!loading && !error && filteredOfertas.length > 0 && (
          <>
            <ul className="flex flex-col gap-4">
              {ofertasVisibles.map((oferta) => (
                <li
                  key={oferta.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href={`/ofertas/${oferta.id}`}
                        className="font-bold text-lg text-gray-900 hover:text-teal-700 transition-colors"
                      >
                        {oferta.titulo}
                      </Link>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                          ESTADO_COLOR[oferta.estado] || 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {oferta.estado}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-teal-700">{oferta.empresa_nombre}</p>

                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {oferta.descripcion}
                    </p>

                    <p className="text-xs text-gray-400 pt-1 font-mono">
                      Publicado el: {new Date(oferta.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>

                  {/* Solo el botón Ver detalle — sin editar ni eliminar */}
                  <div className="flex sm:flex-col justify-end items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    <Link
                      href={`/ofertas/${oferta.id}`}
                      className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 rounded-lg transition-colors text-center w-full sm:w-auto"
                    >
                      Ver detalle
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
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
            />
          </>
        )}
      </div>
    </main>
  )
}
