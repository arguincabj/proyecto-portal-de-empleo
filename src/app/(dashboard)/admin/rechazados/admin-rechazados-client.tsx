'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  UserX,
  Search,
  ExternalLink,
  Building2,
  Briefcase,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  FileText,
  MapPin,
  X,
  User,
} from 'lucide-react'
import { Paginacion } from '@/components/ui/paginacion'

export type PostulanteRechazadoItem = {
  id: string // derivacion id
  fechaRechazo: string
  motivoRechazo: string | null
  oferta: {
    id: string
    titulo: string
    empresaNombre: string
    empresaId?: string | null
  }
  postulante: {
    id: string
    nombre: string
    apellido: string
    dni: string | null
    email: string | null
    telefono: string | null
    localidad: string | null
    direccion: string | null
    estudios: string | null
    cursos: string | null
    experiencia: string | null
    habilidades: string | null
    categorias_laborales?: string[] | null
  }
  cv_signed_url?: string | null
  cv_nombre?: string | null
}

type Props = {
  rechazados: PostulanteRechazadoItem[]
}

const ITEMS_POR_PAGINA = 10

export function AdminRechazadosClient({ rechazados }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [perfilModal, setPerfilModal] = useState<PostulanteRechazadoItem | null>(null)

  // Lista única de empresas
  const empresasDisponibles = useMemo(() => {
    const set = new Set<string>()
    rechazados.forEach((r) => {
      if (r.oferta.empresaNombre) set.add(r.oferta.empresaNombre)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rechazados])

  // Filtrado
  const filtrados = useMemo(() => {
    return rechazados.filter((item) => {
      if (empresaFiltro && item.oferta.empresaNombre !== empresaFiltro) {
        return false
      }

      if (busqueda.trim()) {
        const q = busqueda.trim().toLowerCase()
        const nombreCompleto = `${item.postulante.nombre} ${item.postulante.apellido}`.toLowerCase()
        const dni = (item.postulante.dni ?? '').toLowerCase()
        const ofertaTitulo = item.oferta.titulo.toLowerCase()
        const empresaNombre = item.oferta.empresaNombre.toLowerCase()
        const motivo = (item.motivoRechazo ?? '').toLowerCase()

        const coincide =
          nombreCompleto.includes(q) ||
          dni.includes(q) ||
          ofertaTitulo.includes(q) ||
          empresaNombre.includes(q) ||
          motivo.includes(q)

        if (!coincide) return false
      }

      return true
    })
  }, [rechazados, busqueda, empresaFiltro])

  const totalPaginas = Math.ceil(filtrados.length / ITEMS_POR_PAGINA) || 1
  const paginaValida = Math.min(paginaActual, totalPaginas)
  const visibles = filtrados.slice(
    (paginaValida - 1) * ITEMS_POR_PAGINA,
    paginaValida * ITEMS_POR_PAGINA
  )

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPaginaActual(1)
              }}
              placeholder="Buscar por postulante, DNI, oferta, empresa o motivo..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 placeholder:text-gray-400 bg-gray-50/50"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('')
                  setPaginaActual(1)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="sm:w-64">
            <select
              value={empresaFiltro}
              onChange={(e) => {
                setEmpresaFiltro(e.target.value)
                setPaginaActual(1)
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 bg-white text-gray-700"
            >
              <option value="">Todas las empresas</option>
              {empresasDisponibles.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>
          </div>

          {(busqueda || empresaFiltro) && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('')
                setEmpresaFiltro('')
                setPaginaActual(1)
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 self-end sm:self-center"
            >
              <X className="size-3.5" />
              <span>Restablecer</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista de Rechazados */}
      {visibles.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-12 text-center">
          <UserX className="size-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No se encontraron postulantes rechazados</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            {busqueda || empresaFiltro
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : 'Ninguna empresa ha reportado rechazos de candidatos hasta el momento.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibles.map((item) => {
            const nombre = `${item.postulante.nombre} ${item.postulante.apellido}`.trim() || 'Postulante'

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-xs border border-gray-200 p-5 space-y-4 hover:border-rose-200 transition-all"
              >
                {/* Cabecera: Postulante + Oferta */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="size-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {item.postulante.nombre?.charAt(0)?.toUpperCase()}
                        {item.postulante.apellido?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-gray-900">{nombre}</h3>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Rechazado por la Empresa
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5 font-mono">
                          {item.postulante.dni && <span>DNI: {item.postulante.dni}</span>}
                          {item.postulante.telefono && (
                            <span className="flex items-center gap-1 font-sans">
                              <Phone className="size-3 text-gray-400" />
                              {item.postulante.telefono}
                            </span>
                          )}
                          {item.postulante.email && (
                            <span className="flex items-center gap-1 font-sans">
                              <Mail className="size-3 text-gray-400" />
                              {item.postulante.email}
                            </span>
                          )}
                          {item.postulante.localidad && (
                            <span className="flex items-center gap-1 font-sans">
                              <MapPin className="size-3 text-gray-400" />
                              {item.postulante.localidad}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Datos de la Oferta */}
                    <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold block">
                          Oferta a la que se postuló
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Briefcase className="size-3.5 text-teal-700 shrink-0" />
                          <span className="font-bold text-gray-900">{item.oferta.titulo}</span>
                          <span className="text-gray-400">•</span>
                          <Building2 className="size-3.5 text-gray-400 shrink-0" />
                          <span className="text-gray-700 font-medium">{item.oferta.empresaNombre}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/ofertas/${item.oferta.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-semibold"
                        >
                          <span>Ver oferta</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => setPerfilModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-2xs"
                    >
                      <User className="size-3.5" />
                      <span>Ver ficha</span>
                    </button>

                    {item.cv_signed_url && (
                      <a
                        href={item.cv_signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-2xs"
                      >
                        <FileText className="size-3.5" />
                        <span>Ver CV</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Motivo del Rechazo informado por la empresa */}
                <div className="bg-rose-50/70 border border-rose-200/90 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                      <AlertCircle className="size-4 text-rose-600 shrink-0" />
                      <span>Motivo del rechazo comunicado por la empresa:</span>
                    </div>
                    {item.fechaRechazo && (
                      <span className="text-[11px] text-rose-700 flex items-center gap-1 font-mono">
                        <Calendar className="size-3" />
                        {new Date(item.fechaRechazo).toLocaleDateString('es-AR')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-rose-950 font-medium pl-6 leading-relaxed">
                    {item.motivoRechazo ? item.motivoRechazo : 'La empresa no detalló una nota adicional al momento de marcar el rechazo.'}
                  </p>
                </div>
              </div>
            )
          })}

          {/* Paginación */}
          <Paginacion
            paginaActual={paginaValida}
            totalPaginas={totalPaginas}
            totalItems={filtrados.length}
            itemsPorPagina={ITEMS_POR_PAGINA}
            nombreItems="postulantes rechazados"
            onCambiarPagina={(p) => {
              setPaginaActual(p)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200"
          />
        </div>
      )}

      {/* Modal Ficha Completa */}
      {perfilModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPerfilModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-base">
                  {perfilModal.postulante.nombre?.charAt(0)?.toUpperCase()}
                  {perfilModal.postulante.apellido?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    {perfilModal.postulante.nombre} {perfilModal.postulante.apellido}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Postulado a: {perfilModal.oferta.titulo} ({perfilModal.oferta.empresaNombre})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPerfilModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="size-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                <p className="font-bold text-rose-900">Motivo del rechazo de la empresa:</p>
                <p className="text-rose-950 font-medium">
                  {perfilModal.motivoRechazo || 'Sin motivo adicional detallado.'}
                </p>
              </div>

              {/* Rubros */}
              {Array.isArray(perfilModal.postulante.categorias_laborales) && perfilModal.postulante.categorias_laborales.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Rubros o Categorías Laborales
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {perfilModal.postulante.categorias_laborales.map((c) => (
                      <span key={c} className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Habilidades */}
              {perfilModal.postulante.habilidades && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Habilidades
                  </h4>
                  <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line">
                    {perfilModal.postulante.habilidades}
                  </p>
                </div>
              )}

              {/* Experiencia */}
              {perfilModal.postulante.experiencia && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Experiencia
                  </h4>
                  <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line">
                    {perfilModal.postulante.experiencia}
                  </p>
                </div>
              )}

              {/* Estudios */}
              {perfilModal.postulante.estudios && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Estudios
                  </h4>
                  <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line">
                    {perfilModal.postulante.estudios}
                  </p>
                </div>
              )}

              {/* Cursos */}
              {perfilModal.postulante.cursos && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Cursos y Certificaciones
                  </h4>
                  <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line">
                    {perfilModal.postulante.cursos}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
