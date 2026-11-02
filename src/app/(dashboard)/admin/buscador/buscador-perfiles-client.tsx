'use client'

import { useState, useMemo } from 'react'
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
}

const ITEMS_POR_PAGINA = 12

export function BuscadorPerfilesClient({ postulantes }: Props) {
  // Filtros
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [filtroHabilidad, setFiltroHabilidad] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstadoLaboral, setFiltroEstadoLaboral] = useState<'todos' | 'en_busqueda' | 'trabajando'>('todos')
  const [filtroConCv, setFiltroConCv] = useState<'todos' | 'con_cv' | 'sin_cv'>('todos')
  const [filtroLocalidad, setFiltroLocalidad] = useState('')
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false)

  // Modal de Ficha Completa
  const [perfilModal, setPerfilModal] = useState<PostulanteBuscadorItem | null>(null)

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)

  // Obtener lista única de localidades existentes para el selector
  const listaLocalidades = useMemo(() => {
    const locs = new Set<string>()
    postulantes.forEach((p) => {
      if (p.localidad?.trim()) locs.add(p.localidad.trim())
    })
    return Array.from(locs).sort((a, b) => a.localeCompare(b))
  }, [postulantes])

  // Detectar si el usuario escribió en el buscador o aplicó algún filtro
  const hayBusquedaActiva =
    textoBusqueda.trim() !== '' ||
    filtroHabilidad.trim() !== '' ||
    filtroCategoria.trim() !== '' ||
    filtroEstadoLaboral !== 'todos' ||
    filtroConCv !== 'todos' ||
    filtroLocalidad.trim() !== ''

  // Filtrado reactivo: NO muestra postulantes hasta escribir algo en el buscador o aplicar un filtro
  const postulantesFiltrados = useMemo(() => {
    if (!hayBusquedaActiva) {
      return []
    }

    return postulantes.filter((p) => {
      const q = textoBusqueda.trim().toLowerCase()
      if (q) {
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

      // Filtro por Rubro / Categoría Laboral
      if (filtroCategoria.trim()) {
        const cats = p.categorias_laborales ?? []
        if (!cats.includes(filtroCategoria.trim())) return false
      }

      // Filtro específico por habilidad
      if (filtroHabilidad.trim()) {
        const habQuery = filtroHabilidad.trim().toLowerCase()
        const habs = (p.habilidades ?? '').toLowerCase()
        if (!habs.includes(habQuery)) return false
      }

      // Filtro por Estado Laboral
      if (filtroEstadoLaboral !== 'todos') {
        const est = p.estado_laboral || 'en_busqueda'
        if (est !== filtroEstadoLaboral) return false
      }

      // Filtro por CV
      if (filtroConCv === 'con_cv') {
        const tieneCv = (p.curricula && p.curricula.length > 0) || !!p.cv_url
        if (!tieneCv) return false
      } else if (filtroConCv === 'sin_cv') {
        const tieneCv = (p.curricula && p.curricula.length > 0) || !!p.cv_url
        if (tieneCv) return false
      }

      // Filtro por Localidad
      if (filtroLocalidad.trim()) {
        if ((p.localidad ?? '').trim().toLowerCase() !== filtroLocalidad.trim().toLowerCase()) {
          return false
        }
      }

      return true
    })
  }, [
    postulantes,
    hayBusquedaActiva,
    textoBusqueda,
    filtroHabilidad,
    filtroCategoria,
    filtroEstadoLaboral,
    filtroConCv,
    filtroLocalidad,
  ])

  // Reset de página cuando cambian los filtros
  const totalPaginas = Math.ceil(postulantesFiltrados.length / ITEMS_POR_PAGINA) || 1
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA
  const postulantesPaginados = postulantesFiltrados.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA)

  const hayFiltrosActivos =
    textoBusqueda.trim() !== '' ||
    filtroHabilidad.trim() !== '' ||
    filtroEstadoLaboral !== 'todos' ||
    filtroConCv !== 'todos' ||
    filtroLocalidad.trim() !== ''

  const limpiarFiltros = () => {
    setTextoBusqueda('')
    setFiltroHabilidad('')
    setFiltroCategoria('')
    setFiltroEstadoLaboral('todos')
    setFiltroConCv('todos')
    setFiltroLocalidad('')
    setPaginaActual(1)
  }

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              value={textoBusqueda}
              onChange={(e) => {
                setTextoBusqueda(e.target.value)
                setPaginaActual(1)
              }}
              placeholder="Buscar por nombre, apellido, DNI, email, experiencia, estudios..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-gray-400"
            />
            {textoBusqueda && (
              <button
                type="button"
                onClick={() => {
                  setTextoBusqueda('')
                  setPaginaActual(1)
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
                value={filtroCategoria}
                onChange={(e) => {
                  setFiltroCategoria(e.target.value)
                  setPaginaActual(1)
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
                onChange={(e) => {
                  setFiltroHabilidad(e.target.value)
                  setPaginaActual(1)
                }}
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
                value={filtroEstadoLaboral}
                onChange={(e) => {
                  setFiltroEstadoLaboral(e.target.value as 'todos' | 'en_busqueda' | 'trabajando')
                  setPaginaActual(1)
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
                value={filtroConCv}
                onChange={(e) => {
                  setFiltroConCv(e.target.value as 'todos' | 'con_cv' | 'sin_cv')
                  setPaginaActual(1)
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
                value={filtroLocalidad}
                onChange={(e) => {
                  setFiltroLocalidad(e.target.value)
                  setPaginaActual(1)
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
          {hayBusquedaActiva ? (
            <span>
              Mostrando <strong className="text-gray-900">{postulantesFiltrados.length}</strong> postulantes encontrados
              {hayFiltrosActivos && ` (de un total de ${postulantes.length})`}
            </span>
          ) : (
            <span>Ingresá un término de búsqueda para consultar la base de perfiles ({postulantes.length} postulantes registrados)</span>
          )}
          {hayFiltrosActivos && (
            <span className="text-teal-700 font-medium">Filtros aplicados</span>
          )}
        </div>
      </div>

      {/* Listado de Tarjetas de Postulantes */}
      {!hayBusquedaActiva ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 mb-4">
            <Search className="size-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Escribí en el buscador para ver postulantes</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            Ingresá un nombre, apellido, DNI, habilidades o seleccioná un filtro avanzado para consultar perfiles.
          </p>
        </div>
      ) : postulantesFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-4">
            <Users className="size-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No se encontraron postulantes</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            No hay candidatos que coincidan con los términos de búsqueda ingresados.
          </p>
          <button
            onClick={limpiarFiltros}
            className="mt-4 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
          >
            Limpiar búsqueda y filtros
          </button>
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

            return (
              <div
                key={postulante.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  {/* Encabezado de la tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate group-hover:text-teal-700 transition-colors">
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
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          <GraduationCap className="size-3 text-amber-700" />
                          Derivado a Cursos (3 rechazos)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Datos de contacto y ubicación */}
                  <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    {postulante.localidad && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="size-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{postulante.localidad}</span>
                      </div>
                    )}
                    {postulante.usuario?.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="size-3.5 text-gray-400 shrink-0" />
                        <span className="truncate" title={postulante.usuario.email}>
                          {postulante.usuario.email}
                        </span>
                      </div>
                    )}
                    {postulante.usuario?.telefono && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="size-3.5 text-gray-400 shrink-0" />
                        <span>{postulante.usuario.telefono}</span>
                      </div>
                    )}
                  </div>

                  {/* Habilidades destacadas */}
                  {postulante.habilidades ? (
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Habilidades
                      </span>
                      <p className="text-xs text-gray-700 line-clamp-2 bg-amber-50/50 border border-amber-100/70 p-2 rounded-lg">
                        {postulante.habilidades}
                      </p>
                    </div>
                  ) : null}

                  {/* Experiencia o Estudios breves */}
                  {postulante.experiencia && (
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Experiencia
                      </span>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {postulante.experiencia}
                      </p>
                    </div>
                  )}
                </div>

                {/* Pie de tarjeta con acciones */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-2">
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
      {totalPaginas > 1 && (
        <div className="pt-2 flex justify-center">
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onCambiarPagina={setPaginaActual}
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
                      <span>Derivado a Cursos y Videos (3 rechazos)</span>
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
