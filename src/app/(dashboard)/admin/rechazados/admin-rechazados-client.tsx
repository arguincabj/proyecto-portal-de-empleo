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
  GraduationCap,
  History,
} from 'lucide-react'
import { Paginacion } from '@/components/ui/paginacion'

export type PostulanteRechazadoItem = {
  id: string // derivacion id
  fechaRechazo: string
  motivoRechazo: string | null
  tieneTresRechazos?: boolean
  totalRechazados?: number
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
    totalRechazados?: number
  }
  cv_signed_url?: string | null
  cv_nombre?: string | null
}

type Props = {
  rechazados: PostulanteRechazadoItem[]
}

const ITEMS_POR_PAGINA = 10

export function AdminRechazadosClient({ rechazados }: Props) {
  const [filtroApartado, setFiltroApartado] = useState<'todos' | 'tres_rechazos'>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [perfilModal, setPerfilModal] = useState<PostulanteRechazadoItem | null>(null)

  // Agrupar items por postulante para el apartado de 3 rechazos (1 sola card por persona)
  const gruposConTresRechazos = useMemo(() => {
    const mapa = new Map<
      string,
      {
        representante: PostulanteRechazadoItem
        historialRechazos: Array<{
          id: string
          ofertaTitulo: string
          empresaNombre: string
          ofertaId: string
          motivo: string | null
          fecha: string
        }>
        total: number
      }
    >()

    rechazados.forEach((item) => {
      if (!item.tieneTresRechazos) return

      const postuId = item.postulante.id
      const existente = mapa.get(postuId)

      const rechazoDetalle = {
        id: item.id,
        ofertaTitulo: item.oferta.titulo,
        empresaNombre: item.oferta.empresaNombre,
        ofertaId: item.oferta.id,
        motivo: item.motivoRechazo,
        fecha: item.fechaRechazo,
      }

      if (!existente) {
        mapa.set(postuId, {
          representante: item,
          historialRechazos: [rechazoDetalle],
          total: item.totalRechazados || 3,
        })
      } else {
        existente.historialRechazos.push(rechazoDetalle)
        if ((item.totalRechazados || 0) > existente.total) {
          existente.total = item.totalRechazados!
        }
      }
    })

    return Array.from(mapa.values())
  }, [rechazados])

  // Cantidad de personas únicas en el apartado con 3 rechazos
  const personasConTresRechazosCount = gruposConTresRechazos.length

  // Lista única de empresas
  const empresasDisponibles = useMemo(() => {
    const set = new Set<string>()
    rechazados.forEach((r) => {
      if (r.oferta.empresaNombre) set.add(r.oferta.empresaNombre)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rechazados])

  // Filtrado según el apartado activo
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()

    if (filtroApartado === 'tres_rechazos') {
      // Filtrar sobre los grupos agrupados por postulante (1 sola card por persona)
      return gruposConTresRechazos.filter((grupo) => {
        const item = grupo.representante

        if (empresaFiltro) {
          const participoEmpresa = grupo.historialRechazos.some(
            (h) => h.empresaNombre === empresaFiltro
          )
          if (!participoEmpresa) return false
        }

        if (q) {
          const nombreCompleto = `${item.postulante.nombre} ${item.postulante.apellido}`.toLowerCase()
          const dni = (item.postulante.dni ?? '').toLowerCase()
          const coincideHistorial = grupo.historialRechazos.some(
            (h) =>
              h.ofertaTitulo.toLowerCase().includes(q) ||
              h.empresaNombre.toLowerCase().includes(q) ||
              (h.motivo ?? '').toLowerCase().includes(q)
          )

          if (!nombreCompleto.includes(q) && !dni.includes(q) && !coincideHistorial) {
            return false
          }
        }

        return true
      })
    }

    // Modo 'todos': listado normal de cada derivación rechazada
    return rechazados.filter((item) => {
      if (empresaFiltro && item.oferta.empresaNombre !== empresaFiltro) {
        return false
      }

      if (q) {
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
  }, [rechazados, gruposConTresRechazos, filtroApartado, busqueda, empresaFiltro])

  const totalPaginas = Math.ceil(filtrados.length / ITEMS_POR_PAGINA) || 1
  const paginaValida = Math.min(paginaActual, totalPaginas)
  const visibles = filtrados.slice(
    (paginaValida - 1) * ITEMS_POR_PAGINA,
    paginaValida * ITEMS_POR_PAGINA
  )

  return (
    <div className="space-y-6">
      {/* Selector de Apartados */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => {
            setFiltroApartado('todos')
            setPaginaActual(1)
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filtroApartado === 'todos'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <UserX className="size-3.5" />
          <span>Todos los postulantes rechazados ({rechazados.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFiltroApartado('tres_rechazos')
            setPaginaActual(1)
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filtroApartado === 'tres_rechazos'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <GraduationCap className="size-4" />
          <span>Apartado: Con 3 rechazos / Derivados a Cursos ({personasConTresRechazosCount})</span>
        </button>
      </div>

      {/* Banner explicativo exclusivo del apartado de 3 rechazos */}
      {filtroApartado === 'tres_rechazos' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <GraduationCap className="size-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-amber-950">
              Apartado de Postulantes con 3 Rechazos (Vista Unificada)
            </p>
            <p className="text-amber-800 leading-relaxed">
              En este apartado cada postulante aparece <strong>una única vez</strong> con la insignia destacada de sus <strong>3 o más rechazos</strong> acumulados, junto con el desglose de las búsquedas en las que participó, para no duplicar filas y gestionar ágilmente su derivación formativa.
            </p>
          </div>
        </div>
      )}

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
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 self-end sm:self-center cursor-pointer"
            >
              <X className="size-3.5" />
              <span>Restablecer</span>
            </button>
          )}
        </div>
      </div>

      {/* Listado */}
      {visibles.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-12 text-center">
          <UserX className="size-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">
            {filtroApartado === 'tres_rechazos'
              ? 'No hay postulantes con 3 rechazos acumulados'
              : 'No se encontraron postulantes rechazados'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            {busqueda || empresaFiltro
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : filtroApartado === 'tres_rechazos'
              ? 'Los postulantes aparecerán en este apartado automáticamente (1 sola vez por persona) cuando alcancen su tercer rechazo.'
              : 'Ninguna empresa ha reportado rechazos de candidatos hasta el momento.'}
          </p>
        </div>
      ) : filtroApartado === 'tres_rechazos' ? (
        /* VISTA UNIFICADA: 1 sola card por postulante con sus 3 rechazos */
        <div className="space-y-4">
          {(visibles as typeof gruposConTresRechazos).map((grupo) => {
            const item = grupo.representante
            const nombre = `${item.postulante.nombre} ${item.postulante.apellido}`.trim() || 'Postulante'

            return (
              <div
                key={item.postulante.id}
                className="bg-white rounded-2xl shadow-xs border-2 border-rose-200 p-5 space-y-4 hover:border-rose-300 transition-all"
              >
                {/* Cabecera unificada del Postulante */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="size-11 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-base shrink-0">
                        {item.postulante.nombre?.charAt(0)?.toUpperCase()}
                        {item.postulante.apellido?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-gray-900">{nombre}</h3>
                          {/* Badge destacado de 3 o más rechazos */}
                          <span className="text-xs px-3 py-1 rounded-full font-extrabold bg-rose-600 text-white shadow-xs flex items-center gap-1.5">
                            <AlertCircle className="size-3.5" />
                            <span>Alcanzó los {grupo.total} rechazos</span>
                          </span>
                          <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <GraduationCap className="size-3" />
                            <span>Derivado a Cursos y Videos</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1 font-mono">
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
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => setPerfilModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-2xs cursor-pointer"
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

                {/* Desglose de los rechazos acumulados */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <History className="size-3.5 text-rose-600" />
                    <span>Historial de búsquedas rechazadas ({grupo.historialRechazos.length}):</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {grupo.historialRechazos.map((rechazo, idx) => (
                      <div
                        key={rechazo.id}
                        className="bg-gray-50/90 border border-gray-200/80 rounded-xl p-3 text-xs space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="size-5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-gray-900">{rechazo.ofertaTitulo}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 font-medium">{rechazo.empresaNombre}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            {rechazo.fecha && (
                              <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                                <Calendar className="size-3" />
                                {new Date(rechazo.fecha).toLocaleDateString('es-AR')}
                              </span>
                            )}
                            <Link
                              href={`/ofertas/${rechazo.ofertaId}`}
                              target="_blank"
                              className="text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-0.5 text-[11px]"
                            >
                              <span>Ver oferta</span>
                              <ExternalLink className="size-2.5" />
                            </Link>
                          </div>
                        </div>

                        {/* Motivo informado */}
                        <div className="pl-7 text-gray-700">
                          <span className="text-[11px] font-semibold text-rose-800">Motivo: </span>
                          <span className="italic">
                            {rechazo.motivo ? `"${rechazo.motivo}"` : 'Sin nota detallada por la empresa.'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
            nombreItems="postulantes con 3 rechazos"
            onCambiarPagina={(p) => {
              setPaginaActual(p)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200"
          />
        </div>
      ) : (
        /* VISTA 'TODOS': listado completo de todas las derivaciones rechazadas */
        <div className="space-y-4">
          {(visibles as PostulanteRechazadoItem[]).map((item) => {
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
                          {item.tieneTresRechazos && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-rose-600 text-white">
                              {item.totalRechazados} rechazos acumulados
                            </span>
                          )}
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-2xs cursor-pointer"
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
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="size-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                <p className="font-bold text-rose-900">Motivo del rechazo de la empresa:</p>
                <p className="text-rose-950 font-medium">
                  {perfilModal.motivoRechazo || 'Sin nota de motivo especificada.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-bold block mb-0.5">DNI</span>
                  <span className="font-semibold text-gray-800">{perfilModal.postulante.dni || 'No cargado'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-bold block mb-0.5">Teléfono</span>
                  <span className="font-semibold text-gray-800">{perfilModal.postulante.telefono || 'No cargado'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-bold block mb-0.5">Email</span>
                  <span className="font-semibold text-gray-800 truncate block">{perfilModal.postulante.email || 'No cargado'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-bold block mb-0.5">Localidad</span>
                  <span className="font-semibold text-gray-800">{perfilModal.postulante.localidad || 'Funes'}</span>
                </div>
              </div>

              {perfilModal.postulante.estudios && (
                <div className="text-xs space-y-1">
                  <p className="font-bold text-gray-700">Estudios cursados:</p>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line">
                    {perfilModal.postulante.estudios}
                  </p>
                </div>
              )}

              {perfilModal.postulante.experiencia && (
                <div className="text-xs space-y-1">
                  <p className="font-bold text-gray-700">Experiencia laboral:</p>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line">
                    {perfilModal.postulante.experiencia}
                  </p>
                </div>
              )}

              {perfilModal.postulante.habilidades && (
                <div className="text-xs space-y-1">
                  <p className="font-bold text-gray-700">Habilidades destacadas:</p>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line">
                    {perfilModal.postulante.habilidades}
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
