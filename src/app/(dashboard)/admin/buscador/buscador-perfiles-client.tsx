'use client'

import { useState, useMemo, useRef, useTransition, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Search,
  Users,
  Filter,
  X,
  FileText,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Languages,
  Clock,
  MapPin,
  Mail,
  Phone,
  IdCard,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { Paginacion } from '@/components/ui/paginacion'
import { CATEGORIAS_LABORALES } from '@/constants/categorias-laborales'

export type PostulanteBuscadorItem = {
  id: string
  dni: string | null
  cv_url: string | null
  localidad: string | null
  direccion: string | null
  codigo_postal: string | null
  estudios: string | null
  cursos: string | null
  experiencia: string | null
  idiomas: string | null
  habilidades: string | null
  horarios: string | null
  estado_laboral: string | null
  categorias_laborales?: string[] | null
  created_at: string
  usuario: {
    nombre: string
    apellido: string
    email: string | null
    telefono: string | null
  } | null
  curricula: Array<{
    id: string
    nombre: string
    signedUrl: string | null
    created_at: string
  }>
  totalPostulaciones: number
  tieneTresRechazos?: boolean
}

type Props = {
  postulantes: PostulanteBuscadorItem[]
  paginaActual: number
  totalPaginas: number
  totalItems: number
  filtrosActivos: {
    q: string
    estado: string
    cv: string
    localidad: string
    categoria: string
  }
}

const ITEMS_POR_PAGINA = 15

export function BuscadorPerfilesClient({ postulantes, paginaActual, totalPaginas, totalItems, filtrosActivos }: Props) {
  // Filtros locales y estados
  const [textoBusqueda, setTextoBusqueda] = useState(filtrosActivos.q)
  const [filtroHabilidad, setFiltroHabilidad] = useState('')
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false)

  // Modal de Ficha Completa
  const [perfilModal, setPerfilModal] = useState<PostulanteBuscadorItem | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  // Navegar con filtros en la URL
  const navegarConFiltros = useCallback((overrides: Partial<{
    q: string; estado: string; cv: string; localidad: string; categoria: string; page: number
  }>) => {
    const params = new URLSearchParams()
    const q = overrides.q !== undefined ? overrides.q : filtrosActivos.q
    const estado = overrides.estado !== undefined ? overrides.estado : filtrosActivos.estado
    const cv = overrides.cv !== undefined ? overrides.cv : filtrosActivos.cv
    const localidad = overrides.localidad !== undefined ? overrides.localidad : filtrosActivos.localidad
    const categoria = overrides.categoria !== undefined ? overrides.categoria : filtrosActivos.categoria
    const page = overrides.page !== undefined ? overrides.page : 1
    if (q) params.set('q', q)
    if (estado) params.set('estado', estado)
    if (cv) params.set('cv', cv)
    if (localidad) params.set('localidad', localidad)
    if (categoria) params.set('categoria', categoria)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname)
    })
  }, [filtrosActivos, router, pathname])

  const crearHrefPagina = (p: number) => {
    const params = new URLSearchParams()
    if (filtrosActivos.q) params.set('q', filtrosActivos.q)
    if (filtrosActivos.estado) params.set('estado', filtrosActivos.estado)
    if (filtrosActivos.cv) params.set('cv', filtrosActivos.cv)
    if (filtrosActivos.localidad) params.set('localidad', filtrosActivos.localidad)
    if (filtrosActivos.categoria) params.set('categoria', filtrosActivos.categoria)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  // Lista única de localidades
  const listaLocalidades = useMemo(() => {
    const locs = new Set<string>()
    postulantes.forEach((p) => {
      if (p.localidad?.trim()) locs.add(p.localidad.trim())
    })
    return Array.from(locs).sort((a, b) => a.localeCompare(b))
  }, [postulantes])

  // Filtrado local complementario (habilidad o texto inmediato)
  const postulantesFiltrados = useMemo(() => {
    return postulantes.filter((p) => {
      const q = textoBusqueda.trim().toLowerCase()
      if (q && q !== filtrosActivos.q.toLowerCase()) {
        const nombreCompleto = `${p.usuario?.nombre ?? ''} ${p.usuario?.apellido ?? ''}`.toLowerCase()
        const dni = (p.dni ?? '').toLowerCase()
        const email = (p.usuario?.email ?? '').toLowerCase()
        const telefono = (p.usuario?.telefono ?? '').toLowerCase()
        const experiencia = (p.experiencia ?? '').toLowerCase()
        const estudios = (p.estudios ?? '').toLowerCase()
        const cursos = (p.cursos ?? '').toLowerCase()
        const habilidades = (p.habilidades ?? '').toLowerCase()

        const coincide =
          nombreCompleto.includes(q) ||
          dni.includes(q) ||
          email.includes(q) ||
          telefono.includes(q) ||
          experiencia.includes(q) ||
          estudios.includes(q) ||
          cursos.includes(q) ||
          habilidades.includes(q)

        if (!coincide) return false
      }

      if (filtroHabilidad.trim()) {
        const habQuery = filtroHabilidad.trim().toLowerCase()
        const habs = (p.habilidades ?? '').toLowerCase()
        if (!habs.includes(habQuery)) return false
      }

      return true
    })
  }, [postulantes, textoBusqueda, filtrosActivos.q, filtroHabilidad])

  const postulantesPaginados = postulantesFiltrados

  const hayFiltrosActivos =
    textoBusqueda.trim() !== '' ||
    filtroHabilidad.trim() !== '' ||
    filtrosActivos.categoria.trim() !== '' ||
    filtrosActivos.estado.trim() !== '' ||
    filtrosActivos.cv.trim() !== '' ||
    filtrosActivos.localidad.trim() !== ''

  const limpiarFiltros = () => {
    setTextoBusqueda('')
    setFiltroHabilidad('')
    navegarConFiltros({ q: '', estado: '', cv: '', localidad: '', categoria: '', page: 1 })
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navegarConFiltros({ q: textoBusqueda, page: 1 })
                }
              }}
              placeholder="Buscar por nombre, apellido, DNI, email, experiencia, estudios..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-gray-400"
            />
            {textoBusqueda && (
              <button
                type="button"
                onClick={() => {
                  setTextoBusqueda('')
                  navegarConFiltros({ q: '', page: 1 })
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
              mostrarFiltrosAvanzados || hayFiltrosActivos
                ? 'border-teal-300 bg-teal-50 text-teal-800'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="size-4" />
            <span>Filtros avanzados</span>
            <ChevronDown className={`size-3.5 transition-transform ${mostrarFiltrosAvanzados ? 'rotate-180' : ''}`} />
          </button>

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <X className="size-3.5" />
              Limpiar
            </button>
          )}
        </div>

        {/* Panel Desplegable de Filtros Avanzados */}
        {mostrarFiltrosAvanzados && (
          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-fadeIn">
            {/* Rubro o Categoría Laboral */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Rubro o Categoría Laboral
              </label>
              <select
                value={filtrosActivos.categoria}
                onChange={(e) => {
                  navegarConFiltros({ categoria: e.target.value, page: 1 })
                }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-teal-600 bg-white"
              >
                <option value="">Todos los rubros</option>
                {CATEGORIAS_LABORALES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Habilidades clave */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Habilidades / Competencias
              </label>
              <input
                type="text"
                value={filtroHabilidad}
                onChange={(e) => setFiltroHabilidad(e.target.value)}
                placeholder="Ej: Excel, Ventas, Chofer..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-teal-600"
              />
            </div>

            {/* Estado Laboral */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Situación Laboral
              </label>
              <select
                value={filtrosActivos.estado || 'todos'}
                onChange={(e) => {
                  navegarConFiltros({ estado: e.target.value === 'todos' ? '' : e.target.value, page: 1 })
                }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-teal-600 bg-white"
              >
                <option value="todos">Todos los estados</option>
                <option value="en_busqueda">🟢 En búsqueda activa</option>
                <option value="trabajando">💼 Actualmente trabajando</option>
              </select>
            </div>

            {/* Disponibilidad de CV */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Currículum Vitae (CV)
              </label>
              <select
                value={filtrosActivos.cv || 'todos'}
                onChange={(e) => {
                  navegarConFiltros({ cv: e.target.value === 'todos' ? '' : e.target.value, page: 1 })
                }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-teal-600 bg-white"
              >
                <option value="todos">Todos los perfiles</option>
                <option value="con_cv">📄 Solo con CV cargado</option>
                <option value="sin_cv">⚠️ Sin CV cargado</option>
              </select>
            </div>

            {/* Localidad */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Localidad
              </label>
              <select
                value={filtrosActivos.localidad}
                onChange={(e) => {
                  navegarConFiltros({ localidad: e.target.value, page: 1 })
                }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-teal-600 bg-white"
              >
                <option value="">Todas las localidades</option>
                {listaLocalidades.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Resumen de resultados */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          {hayFiltrosActivos ? (
            <span>
              Mostrando <strong className="text-gray-900">{totalItems}</strong> postulantes encontrados
              {' (de un total de ' + totalItems + ')'}
            </span>
          ) : (
            <span>
              Mostrando todos los perfiles (<strong className="text-gray-900">{totalItems}</strong> postulantes registrados)
            </span>
          )}
          {hayFiltrosActivos && (
            <span className="text-teal-700 font-medium">Filtros aplicados</span>
          )}
        </div>
      </div>

      {/* Listado de Tarjetas de Postulantes */}
      {postulantesPaginados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-4">
            <Users className="size-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No se encontraron postulantes</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            {hayFiltrosActivos
              ? 'No hay candidatos que coincidan con los términos de búsqueda o filtros ingresados.'
              : 'No hay postulantes registrados en el sistema actualmente.'}
          </p>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="mt-4 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
            >
              Limpiar búsqueda y filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {postulantesPaginados.map((postulante) => {
            const nombreCompleto =
              `${postulante.usuario?.nombre ?? ''} ${postulante.usuario?.apellido ?? ''}`.trim() ||
              'Sin nombre registrado'
            const estadoLaboral = postulante.estado_laboral || 'en_busqueda'
            const tieneCurricula = postulante.curricula && postulante.curricula.length > 0
            const cvPrincipal = tieneCurricula ? postulante.curricula[0] : null
            const tieneDatosLaborales = Boolean(
              (postulante.habilidades && postulante.habilidades.trim()) ||
              (postulante.experiencia && postulante.experiencia.trim()) ||
              (postulante.estudios && postulante.estudios.trim())
            )

            return (
              <div
                key={postulante.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between h-[360px] group"
              >
                <div className="space-y-3">
                  {/* Encabezado de la tarjeta */}
                  <div className="flex items-start justify-between gap-2 min-h-[42px]">
                    <div className="min-w-0">
                      <h3
                        className="font-bold text-gray-900 truncate group-hover:text-teal-700 transition-colors"
                        title={nombreCompleto}
                      >
                        {nombreCompleto}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <IdCard className="size-3.5 text-gray-400 shrink-0" />
                        <span>DNI: {postulante.dni || 'No registrado'}</span>
                      </div>
                    </div>

                    {/* Badges de Estado */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {estadoLaboral === 'trabajando' ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="size-1.5 rounded-full bg-blue-500" />
                          Trabajando
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          En búsqueda
                        </span>
                      )}

                      {postulante.tieneTresRechazos && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          <GraduationCap className="size-3 text-amber-700" />
                          CIT (3 rechazos)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Datos de contacto y ubicación con altura uniforme */}
                  <div className="h-[64px] flex flex-col justify-center space-y-1 text-xs text-gray-600 bg-gray-50/70 px-3 py-2 rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="size-3.5 text-gray-400 shrink-0" />
                      <span className="truncate" title={postulante.usuario?.email || 'Sin email registrado'}>
                        {postulante.usuario?.email || 'Sin email registrado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      {postulante.localidad ? (
                        <>
                          <MapPin className="size-3.5 text-teal-600 shrink-0" />
                          <span className="truncate">{postulante.localidad}</span>
                        </>
                      ) : postulante.usuario?.telefono ? (
                        <>
                          <Phone className="size-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{postulante.usuario.telefono}</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="size-3.5 text-gray-300 shrink-0" />
                          <span className="text-gray-400 italic">Localidad no registrada</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Perfil laboral / Habilidades / Experiencia con altura fija para todas las tarjetas */}
                  <div className="h-[108px] overflow-hidden text-xs">
                    {tieneDatosLaborales ? (
                      <div className="h-full flex flex-col justify-between">
                        {postulante.habilidades && postulante.experiencia ? (
                          <>
                            <div className="overflow-hidden">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                                Habilidades
                              </span>
                              <p
                                className="text-xs text-gray-700 truncate font-medium bg-amber-50/70 border border-amber-100 px-2 py-0.5 rounded-md"
                                title={postulante.habilidades}
                              >
                                {postulante.habilidades}
                              </p>
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                                Experiencia
                              </span>
                              <p
                                className="text-xs text-gray-600 line-clamp-2 leading-relaxed"
                                title={postulante.experiencia}
                              >
                                {postulante.experiencia}
                              </p>
                            </div>
                          </>
                        ) : postulante.habilidades ? (
                          <div className="overflow-hidden">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                              Habilidades
                            </span>
                            <p
                              className="text-xs text-gray-700 line-clamp-3 font-medium bg-amber-50/70 border border-amber-100 p-2 rounded-lg leading-relaxed"
                              title={postulante.habilidades}
                            >
                              {postulante.habilidades}
                            </p>
                          </div>
                        ) : postulante.experiencia ? (
                          <div className="overflow-hidden">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                              Experiencia
                            </span>
                            <p
                              className="text-xs text-gray-600 line-clamp-3 leading-relaxed bg-gray-50/80 border border-gray-100 p-2 rounded-lg"
                              title={postulante.experiencia}
                            >
                              {postulante.experiencia}
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-hidden">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                              Estudios
                            </span>
                            <p
                              className="text-xs text-gray-700 line-clamp-3 leading-relaxed bg-blue-50/50 border border-blue-100 p-2 rounded-lg"
                              title={postulante.estudios || ''}
                            >
                              {postulante.estudios}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full rounded-xl border border-dashed border-gray-200/90 bg-gray-50/40 flex flex-col items-center justify-center p-3 text-center">
                        <Briefcase className="size-4 text-gray-300 mb-1" />
                        <p className="text-xs font-medium text-gray-400">Sin datos laborales cargados</p>
                        <p className="text-[10px] text-gray-400/80 mt-0.5">Podés consultar su ficha completa</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pie de tarjeta con acciones alineado uniformemente al fondo */}
                <div className="pt-3.5 mt-auto border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
                  {/* Botón Ver CV */}
                  {cvPrincipal && cvPrincipal.signedUrl ? (
                    <a
                      href={cvPrincipal.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition-colors"
                      title={cvPrincipal.nombre}
                    >
                      <FileText className="size-3.5" />
                      <span className="truncate max-w-[100px]">{cvPrincipal.nombre || 'Ver CV'}</span>
                      <ExternalLink className="size-3 text-teal-600" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">Sin CV adjunto</span>
                  )}

                  {/* Botón Ficha Completa */}
                  <button
                    type="button"
                    onClick={() => setPerfilModal(postulante)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
                  >
                    <span>Ficha completa</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {totalItems > 0 && (
        <div className="pt-2">
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            totalItems={totalItems}
            itemsPorPagina={ITEMS_POR_PAGINA}
            nombreItems="postulantes"
            crearHref={crearHrefPagina}
            className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs"
          />
        </div>
      )}

      {/* Modal: Ficha Completa del Postulante */}
      {perfilModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPerfilModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {perfilModal.usuario?.nombre} {perfilModal.usuario?.apellido}
                  </h2>
                  {perfilModal.estado_laboral === 'trabajando' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Trabajando
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      En búsqueda activa
                    </span>
                  )}
                  {perfilModal.tieneTresRechazos && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <GraduationCap className="size-3.5 text-amber-700" />
                      <span>Derivado a CIT (3 rechazos)</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span>DNI: <strong>{perfilModal.dni || 'Sin especificar'}</strong></span>
                  <span>•</span>
                  <span>Registrado el {new Date(perfilModal.created_at).toLocaleDateString('es-AR')}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPerfilModal(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Datos de Contacto y Residencia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="space-y-1.5">
                <p className="text-gray-500 font-medium">Contacto</p>
                <div className="flex items-center gap-2 text-gray-800">
                  <Mail className="size-4 text-teal-600 shrink-0" />
                  <span className="truncate">{perfilModal.usuario?.email || 'No informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-800">
                  <Phone className="size-4 text-teal-600 shrink-0" />
                  <span>{perfilModal.usuario?.telefono || 'No informado'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-gray-500 font-medium">Domicilio</p>
                <div className="flex items-center gap-2 text-gray-800">
                  <MapPin className="size-4 text-teal-600 shrink-0" />
                  <span>
                    {perfilModal.localidad || 'Localidad no informada'}
                    {perfilModal.direccion ? `, ${perfilModal.direccion}` : ''}
                    {perfilModal.codigo_postal ? ` (CP ${perfilModal.codigo_postal})` : ''}
                  </span>
                </div>
                {perfilModal.horarios && (
                  <div className="flex items-center gap-2 text-gray-800">
                    <Clock className="size-4 text-teal-600 shrink-0" />
                    <span>Disponibilidad: {perfilModal.horarios}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sección de CVs cargados */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="size-4 text-teal-600" />
                <span>Currículums cargados ({perfilModal.curricula.length})</span>
              </h4>
              {perfilModal.curricula.length > 0 ? (
                <div className="space-y-2">
                  {perfilModal.curricula.map((cv) => (
                    <div
                      key={cv.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:border-teal-300 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-semibold text-gray-900 truncate">{cv.nombre}</p>
                        <p className="text-[11px] text-gray-400">
                          Subido el {new Date(cv.created_at).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      {cv.signedUrl ? (
                        <a
                          href={cv.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shrink-0"
                        >
                          <span>Abrir archivo</span>
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No disponible</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl">
                  El postulante aún no ha cargado ningún archivo de currículum vitae.
                </p>
              )}
            </div>

            {/* Perfil Laboral Detallado */}
            <div className="space-y-4">
              {perfilModal.habilidades && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="size-4 text-amber-600" />
                    <span>Habilidades y Aptitudes</span>
                  </p>
                  <p className="text-amber-950 whitespace-pre-wrap">{perfilModal.habilidades}</p>
                </div>
              )}

              {perfilModal.experiencia && (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Briefcase className="size-4 text-teal-600" />
                    <span>Experiencia Laboral</span>
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">{perfilModal.experiencia}</p>
                </div>
              )}

              {perfilModal.estudios && (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <GraduationCap className="size-4 text-teal-600" />
                    <span>Estudios y Formación</span>
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">{perfilModal.estudios}</p>
                </div>
              )}

              {perfilModal.cursos && (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <span>Cursos y Capacitaciones</span>
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">{perfilModal.cursos}</p>
                </div>
              )}

              {perfilModal.idiomas && (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Languages className="size-4 text-teal-600" />
                    <span>Idiomas</span>
                  </p>
                  <p className="text-gray-700">{perfilModal.idiomas}</p>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPerfilModal(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                Cerrar ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
