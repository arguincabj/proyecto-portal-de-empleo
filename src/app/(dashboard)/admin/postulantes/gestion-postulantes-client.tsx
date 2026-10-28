'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  Users,
  Search,
  Send,
  XCircle,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
  Phone,
  Mail,
  IdCard,
  GraduationCap,
  Briefcase,
  X,
  Calendar,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  MapPin,
  CalendarCheck,
  CalendarClock,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Paginacion } from '@/components/ui/paginacion'
import {
  derivarPostulante,
  noEnviarPostulante,
  reabrirPostulante,
  agendarOActualizarPreentrevista,
  actualizarEstadoPreentrevista,
  PreentrevistaItem,
} from '../actions'

export type PostulanteData = {
  id: string
  dni: string | null
  cv_url: string | null
  localidad?: string | null
  direccion?: string | null
  codigo_postal?: string | null
  estudios?: string | null
  cursos?: string | null
  experiencia?: string | null
  idiomas?: string | null
  habilidades?: string | null
  horarios?: string | null
  estado_laboral?: string | null
  cit_asignado?: boolean | null
  cit_estado?: string | null
  usuario: {
    nombre: string
    apellido: string
    email?: string | null
    telefono?: string | null
  } | null
}

export type PostulacionItem = {
  id: string
  estado: string // 'recibida' | 'en_revision' | 'derivada' | 'rechazada_municipalidad'
  created_at: string
  oferta: {
    id: string
    titulo: string
    empresa_nombre: string
    estado?: string
    created_at?: string
  } | null
  derivacion?: {
    id: string
    nota_municipalidad?: string | null
    estado_empresa?: string | null
    created_at?: string
  } | null
  preentrevista?: PreentrevistaItem | null
  postulante: PostulanteData | null
  cv_signed_url?: string | null
  cv_nombre?: string | null
}

type Props = {
  postulaciones: PostulacionItem[]
  ofertaFiltroInicial?: string
}

const ITEMS_POR_PAGINA = 15

export function GestionPostulantesClient({ postulaciones, ofertaFiltroInicial }: Props) {
  // Estado de la oferta actualmente seleccionada (null = muestra el listado de ofertas)
  const [ofertaSeleccionadaId, setOfertaSeleccionadaId] = useState<string | null>(
    ofertaFiltroInicial || null
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [soloPendientes, setSoloPendientes] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)

  // Filtro de estado dentro de la oferta seleccionada
  const [filtroEstadoCandidato, setFiltroEstadoCandidato] = useState<'todos' | 'pendiente' | 'derivada' | 'rechazada'>('todos')

  // Modales
  const [perfilModalItem, setPerfilModalItem] = useState<PostulacionItem | null>(null)
  const [modalDerivar, setModalDerivar] = useState<PostulacionItem | null>(null)
  const [notaDerivacion, setNotaDerivacion] = useState('')

  // Modal Preentrevista
  const [modalPreentrevista, setModalPreentrevista] = useState<PostulacionItem | null>(null)
  const [formFechaHora, setFormFechaHora] = useState('')
  const [formLugar, setFormLugar] = useState('Presencial en Oficina de Empleo')
  const [formNotas, setFormNotas] = useState('')
  const [formResultado, setFormResultado] = useState<'pendiente' | 'aprobada' | 'no_asistio' | 'desfavorable'>('pendiente')

  const [isPending, startTransition] = useTransition()

  // Agrupación de todas las postulaciones por Oferta
  const todasOfertasAgrupadas = useMemo(() => {
    const mapa = new Map<
      string,
      {
        ofertaId: string
        ofertaTitulo: string
        empresaNombre: string
        fechaOferta?: string
        postulaciones: PostulacionItem[]
      }
    >()

    postulaciones.forEach((item) => {
      const oid = item.oferta?.id || 'sin-oferta'
      if (!mapa.has(oid)) {
        mapa.set(oid, {
          ofertaId: oid,
          ofertaTitulo: item.oferta?.titulo || 'Oferta sin título',
          empresaNombre: item.oferta?.empresa_nombre || 'Sin empresa especificada',
          fechaOferta: item.oferta?.created_at,
          postulaciones: [],
        })
      }
      mapa.get(oid)!.postulaciones.push(item)
    })

    return Array.from(mapa.values())
  }, [postulaciones])

  // Métricas generales globales
  const totalPostulaciones = postulaciones.length
  const pendientesCount = postulaciones.filter(
    (p) => p.estado !== 'derivada' && p.estado !== 'rechazada_municipalidad'
  ).length
  const derivadasCount = postulaciones.filter((p) => p.estado === 'derivada').length
  const noEnviadasCount = postulaciones.filter((p) => p.estado === 'rechazada_municipalidad').length

  // Filtrado de la lista de ofertas (para la vista principal)
  const ofertasFiltradas = useMemo(() => {
    return todasOfertasAgrupadas.filter((grupo) => {
      const cantPendientes = grupo.postulaciones.filter(
        (p) => p.estado !== 'derivada' && p.estado !== 'rechazada_municipalidad'
      ).length

      if (soloPendientes && cantPendientes === 0) {
        return false
      }

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim()
        const coincideOferta = grupo.ofertaTitulo.toLowerCase().includes(query)
        const coincideEmpresa = grupo.empresaNombre.toLowerCase().includes(query)
        const coincidePostulante = grupo.postulaciones.some((p) => {
          const nom = `${p.postulante?.usuario?.nombre || ''} ${p.postulante?.usuario?.apellido || ''}`.toLowerCase()
          const dni = (p.postulante?.dni || '').toLowerCase()
          return nom.includes(query) || dni.includes(query)
        })

        return coincideOferta || coincideEmpresa || coincidePostulante
      }

      return true
    })
  }, [todasOfertasAgrupadas, soloPendientes, searchTerm])

  // Paginación para el listado de ofertas
  const totalPaginas = Math.ceil(ofertasFiltradas.length / ITEMS_POR_PAGINA) || 1
  const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas)
  const inicio = (paginaValida - 1) * ITEMS_POR_PAGINA
  const fin = Math.min(inicio + ITEMS_POR_PAGINA, ofertasFiltradas.length)
  const ofertasVisibles = ofertasFiltradas.slice(inicio, fin)

  // Obtener los datos de la oferta seleccionada (si hay una activa)
  const ofertaSeleccionada = useMemo(() => {
    if (!ofertaSeleccionadaId) return null
    return todasOfertasAgrupadas.find((g) => g.ofertaId === ofertaSeleccionadaId) || null
  }, [todasOfertasAgrupadas, ofertaSeleccionadaId])

  // Postulantes de la oferta seleccionada filtrados por estado si aplica
  const postulantesDeOferta = useMemo(() => {
    if (!ofertaSeleccionada) return []
    return ofertaSeleccionada.postulaciones.filter((p) => {
      if (filtroEstadoCandidato === 'pendiente') {
        return p.estado !== 'derivada' && p.estado !== 'rechazada_municipalidad'
      }
      if (filtroEstadoCandidato === 'derivada') {
        return p.estado === 'derivada'
      }
      if (filtroEstadoCandidato === 'rechazada') {
        return p.estado === 'rechazada_municipalidad'
      }
      return true
    })
  }, [ofertaSeleccionada, filtroEstadoCandidato])

  // Acciones
  const handleConfirmarDerivacion = () => {
    if (!modalDerivar) return

    startTransition(async () => {
      const res = await derivarPostulante(modalDerivar.id, notaDerivacion)
      if (res.ok) {
        toast.success('¡Postulante enviado exitosamente a la empresa!')
        setModalDerivar(null)
        setNotaDerivacion('')
        if (perfilModalItem && perfilModalItem.id === modalDerivar.id) {
          setPerfilModalItem({ ...perfilModalItem, estado: 'derivada' })
        }
      } else {
        toast.error(res.error || 'Error al derivar el postulante')
      }
    })
  }

  const handleNoEnviar = (postulacionId: string) => {
    startTransition(async () => {
      const res = await noEnviarPostulante(postulacionId)
      if (res.ok) {
        toast.info('Postulante marcado como no enviado. La empresa no podrá verlo.')
        if (perfilModalItem && perfilModalItem.id === postulacionId) {
          setPerfilModalItem({ ...perfilModalItem, estado: 'rechazada_municipalidad' })
        }
      } else {
        toast.error(res.error || 'Error al actualizar')
      }
    })
  }

  const handleReabrir = (postulacionId: string) => {
    startTransition(async () => {
      const res = await reabrirPostulante(postulacionId)
      if (res.ok) {
        toast.success('Postulación reabierta para revisión.')
        if (perfilModalItem && perfilModalItem.id === postulacionId) {
          setPerfilModalItem({ ...perfilModalItem, estado: 'recibida' })
        }
      } else {
        toast.error(res.error || 'Error al reabrir')
      }
    })
  }

  // Preentrevista handlers
  const handleAbrirPreentrevista = (postulacion: PostulacionItem) => {
    setModalPreentrevista(postulacion)
    const existing = postulacion.preentrevista
    if (existing) {
      // Ajustar fecha para input datetime-local: YYYY-MM-DDTHH:mm
      try {
        const d = new Date(existing.fecha_hora)
        // Convertir a horario local para el input
        const pad = (n: number) => String(n).padStart(2, '0')
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        setFormFechaHora(formatted)
      } catch {
        setFormFechaHora('')
      }
      setFormLugar(existing.lugar_modalidad || 'Presencial en Oficina de Empleo')
      setFormNotas(existing.notas || '')
      setFormResultado(existing.resultado as any || 'pendiente')
    } else {
      // Valor por defecto: mañana a las 10:00 o la próxima hora
      const d = new Date()
      d.setDate(d.getDate() + 1)
      d.setHours(10, 0, 0, 0)
      const pad = (n: number) => String(n).padStart(2, '0')
      const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      setFormFechaHora(formatted)
      setFormLugar('Presencial en Oficina de Empleo')
      setFormNotas('')
      setFormResultado('pendiente')
    }
  }

  const handleGuardarPreentrevista = () => {
    if (!modalPreentrevista) return
    if (!formFechaHora) {
      toast.error('Por favor, seleccioná la fecha y hora acordada.')
      return
    }

    const fechaSeleccionada = new Date(formFechaHora)
    const ahora = new Date()
    if (fechaSeleccionada.getTime() < ahora.getTime() - 2 * 60 * 1000) {
      toast.error('No se pueden seleccionar fechas u horarios ya pasados.')
      return
    }

    startTransition(async () => {
      const res = await agendarOActualizarPreentrevista({
        preentrevistaId: modalPreentrevista.preentrevista?.id,
        postulacionId: modalPreentrevista.id,
        fechaHora: fechaSeleccionada.toISOString(),
        lugarModalidad: formLugar,
        notas: formNotas,
        estado: modalPreentrevista.preentrevista?.id ? 'reprogramada' : 'programada',
        resultado: formResultado,
      })

      if (res.ok) {
        toast.success(
          modalPreentrevista.preentrevista?.id
            ? 'Preentrevista reprogramada exitosamente.'
            : 'Preentrevista agendada exitosamente.'
        )
        setModalPreentrevista(null)
      } else {
        toast.error(res.error || 'Error al guardar preentrevista.')
      }
    })
  }

  const handleMarcarResultadoPreentrevista = (
    postulacion: PostulacionItem,
    nuevoResultado: 'aprobada' | 'no_asistio' | 'desfavorable'
  ) => {
    if (!postulacion.preentrevista?.id) return

    // Validar que la fecha y hora de la preentrevista ya haya pasado
    const fechaEntrevista = new Date(postulacion.preentrevista.fecha_hora)
    const ahora = new Date()
    if (fechaEntrevista.getTime() > ahora.getTime()) {
      toast.error('Aún no pasó la fecha y hora de la preentrevista. Solo podés calificar la asistencia una vez transcurrida la cita pactada.')
      return
    }

    startTransition(async () => {
      const res = await actualizarEstadoPreentrevista(
        postulacion.preentrevista!.id,
        nuevoResultado === 'no_asistio' ? 'reprogramada' : 'completada',
        nuevoResultado
      )
      if (res.ok) {
        if (nuevoResultado === 'no_asistio') {
          toast.info('Se registró que el postulante no asistió. Podés reprogramar la fecha cuando corresponda.')
        } else if (nuevoResultado === 'aprobada') {
          toast.success('Preentrevista marcada como aprobada. Podés derivar al postulante a la empresa.')
        } else {
          toast.info('Preentrevista finalizada.')
        }
      } else {
        toast.error(res.error || 'Error al actualizar resultado.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas Generales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setSoloPendientes(true)
            setOfertaSeleccionadaId(null)
            setPaginaActual(1)
          }}
          className={`cursor-pointer transition-all rounded-2xl border p-5 shadow-xs ${
            soloPendientes && !ofertaSeleccionadaId
              ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-400/30'
              : 'bg-amber-50 border-amber-200 hover:bg-amber-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pendientes de Selección</p>
            <Clock className="size-4 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-900 mt-3">{pendientesCount}</p>
          <p className="text-xs text-amber-700 mt-1">Esperando decisión municipal</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Enviadas a Empresas</p>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-900 mt-3">{derivadasCount}</p>
          <p className="text-xs text-emerald-700 mt-1">Habilitadas para evaluación</p>
        </div>

        <div className="bg-gray-100 border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">No Enviadas</p>
            <XCircle className="size-4 text-gray-500" />
          </div>
          <p className="text-3xl font-black text-gray-800 mt-3">{noEnviadasCount}</p>
          <p className="text-xs text-gray-500 mt-1">Descartadas por el municipio</p>
        </div>

        <div
          onClick={() => {
            setSoloPendientes(false)
            setOfertaSeleccionadaId(null)
            setPaginaActual(1)
          }}
          className="cursor-pointer transition-all rounded-2xl border border-gray-200 bg-white hover:border-teal-300 p-5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Postulaciones</p>
            <Users className="size-4 text-teal-600" />
          </div>
          <p className="text-3xl font-black text-gray-900 mt-3">{totalPostulaciones}</p>
          <p className="text-xs text-gray-500 mt-1">En {todasOfertasAgrupadas.length} ofertas registradas</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: LISTADO DE OFERTAS A LAS QUE SE POSTULARON LOS PERFILES          */}
      {/* ========================================================================= */}
      {!ofertaSeleccionada ? (
        <div className="space-y-5">
          {/* Barra de Filtros y Búsqueda de Ofertas */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 relative">
              <Search className="size-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por título de oferta, empresa o nombre de postulante..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPaginaActual(1)
                }}
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSoloPendientes(!soloPendientes)
                  setPaginaActual(1)
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors border ${
                  soloPendientes
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Clock className="size-3.5 text-amber-600" />
                <span>Solo ofertas con pendientes ({pendientesCount})</span>
              </button>

              {(searchTerm || soloPendientes) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setSoloPendientes(false)
                    setPaginaActual(1)
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800 px-2.5 py-2 rounded-lg border border-dashed border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Restablecer
                </button>
              )}
            </div>
          </div>

          {/* Listado de Ofertas */}
          {ofertasVisibles.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-12 text-center">
              <Users className="size-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No se encontraron ofertas con postulaciones</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                {searchTerm || soloPendientes
                  ? 'No hay ofertas que coincidan con la búsqueda o filtros aplicados.'
                  : 'Aún no se han recibido postulaciones en ninguna oferta laboral.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-gray-500 px-1">
                Seleccioná una oferta para revisar sus candidatos y decidir si enviar la solicitud a la empresa:
              </div>

              {ofertasVisibles.map((grupo) => {
                const totalCandidatos = grupo.postulaciones.length
                const cantPendientes = grupo.postulaciones.filter(
                  (p) => p.estado !== 'derivada' && p.estado !== 'rechazada_municipalidad'
                ).length
                const cantDerivadas = grupo.postulaciones.filter((p) => p.estado === 'derivada').length
                const cantNoEnviadas = grupo.postulaciones.filter((p) => p.estado === 'rechazada_municipalidad').length

                return (
                  <div
                    key={grupo.ofertaId}
                    className="bg-white rounded-2xl shadow-xs border border-gray-200 p-5 hover:border-teal-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-gray-900">{grupo.ofertaTitulo}</h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-teal-50 text-teal-800 border border-teal-200">
                          {grupo.empresaNombre}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {cantPendientes > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                            <Clock className="size-3 text-amber-700" />
                            {cantPendientes} {cantPendientes === 1 ? 'pendiente de selección' : 'pendientes de selección'}
                          </span>
                        )}

                        {cantDerivadas > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            {cantDerivadas} enviadas
                          </span>
                        )}

                        {cantNoEnviadas > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                            <XCircle className="size-3 text-gray-400" />
                            {cantNoEnviadas} no enviadas
                          </span>
                        )}

                        <span className="text-xs text-gray-400 font-mono pl-1">
                          Total: {totalCandidatos} {totalCandidatos === 1 ? 'postulante' : 'postulantes'}
                        </span>
                      </div>
                    </div>

                    {/* Botón para entrar a la oferta */}
                    <div className="shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setOfertaSeleccionadaId(grupo.ofertaId)
                          setFiltroEstadoCandidato('todos')
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          cantPendientes > 0
                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
                            : 'bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300'
                        }`}
                      >
                        <span>Entrar a gestionar ({totalCandidatos})</span>
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Paginación de ofertas */}
              <Paginacion
                paginaActual={paginaValida}
                totalPaginas={totalPaginas}
                totalItems={ofertasFiltradas.length}
                itemsPorPagina={ITEMS_POR_PAGINA}
                nombreItems="ofertas con postulaciones"
                onCambiarPagina={(p) => {
                  setPaginaActual(p)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200"
              />
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VISTA 2: DENTRO DE LA OFERTA SELECCIONADA — DECIDIR ENVIAR SOLICITUD O NO */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Barra Superior con botón Volver y datos de la Oferta */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  setOfertaSeleccionadaId(null)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl transition-colors self-start"
              >
                <ArrowLeft className="size-3.5" />
                <span>Volver a todas las ofertas</span>
              </button>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-500">Filtrar candidatos:</span>
                <button
                  type="button"
                  onClick={() => setFiltroEstadoCandidato('todos')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    filtroEstadoCandidato === 'todos'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos ({ofertaSeleccionada.postulaciones.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstadoCandidato('pendiente')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    filtroEstadoCandidato === 'pendiente'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  Pendientes (
                  {
                    ofertaSeleccionada.postulaciones.filter(
                      (p) => p.estado !== 'derivada' && p.estado !== 'rechazada_municipalidad'
                    ).length
                  }
                  )
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstadoCandidato('derivada')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    filtroEstadoCandidato === 'derivada'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Enviados ({ofertaSeleccionada.postulaciones.filter((p) => p.estado === 'derivada').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstadoCandidato('rechazada')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    filtroEstadoCandidato === 'rechazada'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  No enviados (
                  {
                    ofertaSeleccionada.postulaciones.filter(
                      (p) => p.estado === 'rechazada_municipalidad'
                    ).length
                  }
                  )
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  {ofertaSeleccionada.empresaNombre}
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">
                  {ofertaSeleccionada.ofertaTitulo}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Elegí para cada postulante si enviar la solicitud a la empresa o no enviarla.
                </p>
              </div>

              <Link
                href={`/ofertas/${ofertaSeleccionada.ofertaId}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-700 hover:underline self-start md:self-center"
              >
                <span>Ver publicación original</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>

          {/* Listado de Candidatos para esta Oferta */}
          {postulantesDeOferta.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-12 text-center">
              <Users className="size-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No hay postulantes con este filtro</h3>
              <p className="text-xs text-gray-500 mt-1">
                Cambiá el filtro de arriba para visualizar los demás candidatos de esta oferta.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {postulantesDeOferta.map((postulacion) => {
                const postUser = postulacion.postulante?.usuario
                const nombreCompleto =
                  [postUser?.nombre, postUser?.apellido].filter(Boolean).join(' ') ||
                  (postulacion.postulante?.dni ? `Postulante (DNI ${postulacion.postulante.dni})` : 'Postulante registrado')

                const esDerivada = postulacion.estado === 'derivada'
                const esNoEnviada = postulacion.estado === 'rechazada_municipalidad'
                const esPendiente = !esDerivada && !esNoEnviada

                const cvUrlFinal = postulacion.cv_signed_url || (postulacion.postulante?.cv_url?.startsWith('http') ? postulacion.postulante.cv_url : null)

                return (
                  <div
                    key={postulacion.id}
                    className={`bg-white rounded-2xl shadow-xs border p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      esPendiente
                        ? 'border-amber-200 bg-amber-50/20'
                        : esDerivada
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-gray-200 bg-gray-50/40'
                    }`}
                  >
                    {/* Información del Postulante */}
                    <div className="space-y-2 flex-1 min-w-0 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPerfilModalItem(postulacion)}
                          className="font-bold text-base text-gray-900 hover:text-teal-700 hover:underline transition-colors text-left"
                        >
                          {nombreCompleto}
                        </button>

                        {esPendiente && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <Clock className="size-3 text-amber-700" />
                            Pendiente de selección
                          </span>
                        )}

                        {esDerivada && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Enviada a la empresa
                          </span>
                        )}

                        {esNoEnviada && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-gray-100 text-gray-600 border border-gray-300 flex items-center gap-1">
                            <XCircle className="size-3 text-gray-500" />
                            No enviada a la empresa
                          </span>
                        )}

                        {postulacion.postulante?.cit_asignado && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <GraduationCap className="size-3 text-amber-700" />
                            Derivado a Curso CIT (3+ rechazos)
                          </span>
                        )}
                      </div>

                      {/* Datos de contacto y fecha */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-mono">
                        {postulacion.postulante?.dni && (
                          <span className="flex items-center gap-1">
                            <IdCard className="size-3.5 text-gray-400" />
                            DNI: {postulacion.postulante.dni}
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md font-sans font-medium border border-teal-100">
                          <MapPin className="size-3 text-teal-600" />
                          {postulacion.postulante?.localidad ? postulacion.postulante.localidad : 'Localidad: No informada'}
                        </span>

                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-sans font-medium border ${
                          postulacion.postulante?.estado_laboral === 'trabajando'
                            ? 'text-blue-800 bg-blue-50 border-blue-100'
                            : 'text-emerald-800 bg-emerald-50 border-emerald-100'
                        }`}>
                          <span className="text-[10px]">{postulacion.postulante?.estado_laboral === 'trabajando' ? '🔵' : '🟢'}</span>
                          {postulacion.postulante?.estado_laboral === 'trabajando' ? 'Trabajando' : 'En búsqueda'}
                        </span>

                        {postUser?.telefono && (
                          <a
                            href={`tel:${postUser.telefono}`}
                            className="flex items-center gap-1 hover:text-teal-700 hover:underline"
                          >
                            <Phone className="size-3.5 text-gray-400" />
                            {postUser.telefono}
                          </a>
                        )}

                        {postUser?.email && (
                          <a
                            href={`mailto:${postUser.email}`}
                            className="flex items-center gap-1 hover:text-teal-700 hover:underline"
                          >
                            <Mail className="size-3.5 text-gray-400" />
                            {postUser.email}
                          </a>
                        )}

                        <span className="flex items-center gap-1 text-gray-400">
                          <Calendar className="size-3.5 text-gray-400" />
                          Postulado: {new Date(postulacion.created_at).toLocaleDateString('es-AR')}
                        </span>
                      </div>

                      {/* Información de Preentrevista si existe */}
                      {postulacion.preentrevista && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            postulacion.preentrevista.resultado === 'aprobada'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : postulacion.preentrevista.resultado === 'no_asistio'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : postulacion.preentrevista.resultado === 'desfavorable'
                              ? 'bg-orange-50 text-orange-800 border-orange-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            <CalendarClock className="size-3.5" />
                            <span>
                              Preentrevista: {new Date(postulacion.preentrevista.fecha_hora).toLocaleString('es-AR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                            <span className="font-bold">
                              ({postulacion.preentrevista.resultado === 'no_asistio'
                                ? 'No asistió'
                                : postulacion.preentrevista.resultado === 'aprobada'
                                ? 'Aprobada'
                                : postulacion.preentrevista.resultado === 'desfavorable'
                                ? 'No favorable'
                                : 'Programada'})
                            </span>
                          </div>

                          {/* Botón rápido para reprogramar si no pudo asistir */}
                          <button
                            type="button"
                            onClick={() => handleAbrirPreentrevista(postulacion)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            <RotateCcw className="size-3" />
                            <span>Reprogramar / Editar</span>
                          </button>

                          {/* Opciones rápidas de resultado: SOLO si ya pasó la fecha y hora pactada */}
                          {postulacion.preentrevista.resultado === 'pendiente' && (() => {
                            const yaPasoFecha = new Date(postulacion.preentrevista.fecha_hora).getTime() <= Date.now()
                            if (!yaPasoFecha) {
                              return (
                                <span className="text-[11px] text-gray-400 italic">
                                  (Pendiente de realización)
                                </span>
                              )
                            }

                            return (
                              <div className="inline-flex items-center gap-1.5 ml-1">
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleMarcarResultadoPreentrevista(postulacion, 'aprobada')}
                                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                                  title="Marcar como aprobada y realizada"
                                >
                                  ✓ Asistió / Aprobó
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleMarcarResultadoPreentrevista(postulacion, 'no_asistio')}
                                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors"
                                  title="Marcar que no asistió para reprogramar"
                                >
                                  ✕ No asistió
                                </button>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* Nota de derivación si existe */}
                      {esDerivada && postulacion.derivacion?.nota_municipalidad && (
                        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1 mt-1 inline-block">
                          <span className="font-semibold">Nota enviada:</span>{' '}
                          {postulacion.derivacion.nota_municipalidad}
                        </p>
                      )}
                    </div>

                    {/* Acciones y Botones de Decisión */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                      {/* Botón Ver CV */}
                      {cvUrlFinal ? (
                        <a
                          href={cvUrlFinal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-2xs max-w-[200px]"
                          title={postulacion.cv_nombre ? `CV adjunto: ${postulacion.cv_nombre}` : 'Abrir CV adjunto en pestaña nueva'}
                        >
                          <FileText className="size-3.5 shrink-0" />
                          <span className="truncate">{postulacion.cv_nombre || 'Ver CV'}</span>
                          <ExternalLink className="size-3 text-gray-400 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-400 border border-gray-200 px-2 py-1 rounded-lg">
                          Datos de perfil (Sin archivo adjunto)
                        </span>
                      )}

                      {/* Botón Ver Perfil Completo */}
                      <button
                        type="button"
                        onClick={() => setPerfilModalItem(postulacion)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs"
                      >
                        <Users className="size-3.5 text-gray-500" />
                        <span>Ficha completa</span>
                      </button>

                      {/* Botón de Preentrevista (Opcional) */}
                      {!esDerivada && (
                        <button
                          type="button"
                          onClick={() => handleAbrirPreentrevista(postulacion)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors shadow-2xs ${
                            postulacion.preentrevista
                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                          }`}
                          title="Acordar o reprogramar preentrevista previa (opcional)"
                        >
                          <CalendarCheck className="size-3.5 text-blue-600" />
                          <span>
                            {postulacion.preentrevista
                              ? postulacion.preentrevista.resultado === 'no_asistio'
                                ? 'Reprogramar entrevista'
                                : 'Ver preentrevista'
                              : 'Preentrevista'}
                          </span>
                        </button>
                      )}

                      {/* BOTONES PRINCIPALES DE DECISIÓN: ENVIAR SOLICITUD vs NO ENVIAR */}
                      {esPendiente && (
                        <div className="flex items-center gap-2 pl-1 border-l border-gray-200">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              setModalDerivar(postulacion)
                              setNotaDerivacion('')
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-2xs disabled:opacity-50"
                          >
                            <Send className="size-3.5" />
                            <span>Enviar solicitud</span>
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleNoEnviar(postulacion.id)}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors shadow-2xs disabled:opacity-50"
                            title="No enviar este postulante a la empresa"
                          >
                            <XCircle className="size-3.5" />
                            <span>No enviar</span>
                          </button>
                        </div>
                      )}

                      {esDerivada && (
                        <div className="flex items-center gap-2 pl-1 border-l border-gray-200">
                          <span className="text-xs font-bold text-emerald-700 hidden sm:inline">
                            ✓ Enviado
                          </span>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleNoEnviar(postulacion.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors shadow-2xs disabled:opacity-50"
                            title="Cancelar envío y quitar del panel de la empresa"
                          >
                            <XCircle className="size-3.5" />
                            <span>Cancelar envío</span>
                          </button>
                        </div>
                      )}

                      {esNoEnviada && (
                        <div className="flex items-center gap-1.5 pl-1 border-l border-gray-200">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleReabrir(postulacion.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-2xs"
                            title="Volver a estado pendiente"
                          >
                            Restablecer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Enviar a Empresa con nota opcional                                */}
      {/* ========================================================================= */}
      {modalDerivar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-teal-50/50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Enviar Postulante a Empresa
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">
                  {[modalDerivar.postulante?.usuario?.nombre, modalDerivar.postulante?.usuario?.apellido].filter(Boolean).join(' ') ||
                    (modalDerivar.postulante?.dni ? `Postulante (DNI ${modalDerivar.postulante.dni})` : 'Postulante registrado')}
                </h3>
                <p className="text-xs text-gray-500">
                  Oferta: {modalDerivar.oferta?.titulo} · {modalDerivar.oferta?.empresa_nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalDerivar(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200/50"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tarjeta destacada con la Localidad del postulante para confirmación */}
              <div className="bg-teal-50/70 rounded-2xl p-4 border border-teal-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Localidad del postulante:</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-900 bg-white px-3 py-1 rounded-lg border border-teal-200 shadow-2xs">
                    <MapPin className="size-3.5 text-teal-600" />
                    {modalDerivar.postulante?.localidad || 'No informada'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Situación laboral:</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-lg border shadow-2xs ${
                    modalDerivar.postulante?.estado_laboral === 'trabajando'
                      ? 'text-blue-900 bg-white border-blue-200'
                      : 'text-emerald-900 bg-white border-emerald-200'
                  }`}>
                    <span className="text-[10px]">{modalDerivar.postulante?.estado_laboral === 'trabajando' ? '🔵' : '🟢'}</span>
                    {modalDerivar.postulante?.estado_laboral === 'trabajando' ? 'Actualmente trabajando' : 'En búsqueda laboral'}
                  </span>
                </div>
                {(modalDerivar.postulante?.direccion || modalDerivar.postulante?.codigo_postal) && (
                  <div className="text-xs text-gray-600 flex flex-wrap items-center gap-3 pt-2 border-t border-teal-100">
                    {modalDerivar.postulante?.direccion && (
                      <span>
                        Dirección: <strong className="text-gray-800">{modalDerivar.postulante.direccion}</strong>
                      </span>
                    )}
                    {modalDerivar.postulante?.codigo_postal && (
                      <span>
                        Código Postal: <strong className="text-gray-800">{modalDerivar.postulante.codigo_postal}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Al enviar esta postulación, los datos de contacto y el CV del candidato quedarán habilitados
                en el panel de <strong>{modalDerivar.oferta?.empresa_nombre}</strong> para que puedan
                evaluarlo y avanzar en el proceso de selección.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="nota-derivacion" className="block text-xs font-semibold text-gray-700">
                  Nota u observación para la empresa (opcional):
                </label>
                <textarea
                  id="nota-derivacion"
                  rows={3}
                  placeholder="Ej: Perfil preseleccionado con experiencia afín. Buena disponibilidad..."
                  value={notaDerivacion}
                  onChange={(e) => setNotaDerivacion(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalDerivar(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirmarDerivacion}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs disabled:opacity-50"
                >
                  <Send className="size-3.5" />
                  <span>{isPending ? 'Enviando...' : 'Confirmar y Enviar Solicitud'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Ficha y Perfil Completo del Postulante                             */}
      {/* ========================================================================= */}
      {perfilModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-gray-50/80">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Ficha Completa del Postulante
                </span>
                <h3 className="text-xl font-bold text-gray-900">
                  {[perfilModalItem.postulante?.usuario?.nombre, perfilModalItem.postulante?.usuario?.apellido].filter(Boolean).join(' ') ||
                    (perfilModalItem.postulante?.dni ? `Postulante (DNI ${perfilModalItem.postulante.dni})` : 'Postulante registrado')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Postulado a &quot;{perfilModalItem.oferta?.titulo}&quot; · {perfilModalItem.oferta?.empresa_nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPerfilModalItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Tarjeta de Encabezado y CV */}
              <div className="bg-teal-50/60 rounded-2xl p-5 border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-gray-900">
                      {[perfilModalItem.postulante?.usuario?.nombre, perfilModalItem.postulante?.usuario?.apellido].filter(Boolean).join(' ') ||
                        (perfilModalItem.postulante?.dni ? `Postulante (DNI ${perfilModalItem.postulante.dni})` : 'Postulante registrado')}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        perfilModalItem.estado === 'derivada'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : perfilModalItem.estado === 'rechazada_municipalidad'
                          ? 'bg-gray-100 text-gray-600 border-gray-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {perfilModalItem.estado === 'derivada'
                        ? 'Enviada a la empresa'
                        : perfilModalItem.estado === 'rechazada_municipalidad'
                        ? 'No enviada'
                        : 'Pendiente de decisión'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 font-mono pt-1">
                    {perfilModalItem.postulante?.dni && (
                      <span className="flex items-center gap-1">
                        <IdCard className="size-3.5 text-gray-400" />
                        DNI: {perfilModalItem.postulante.dni}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-teal-800 bg-white/90 px-2 py-0.5 rounded-md font-sans font-medium border border-teal-200/60">
                      <MapPin className="size-3.5 text-teal-600" />
                      Localidad: {perfilModalItem.postulante?.localidad || 'No informada'}
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-sans font-medium border ${
                      perfilModalItem.postulante?.estado_laboral === 'trabajando'
                        ? 'text-blue-800 bg-blue-50 border-blue-200/60'
                        : 'text-emerald-800 bg-emerald-50 border-emerald-200/60'
                    }`}>
                      <span className="text-[10px]">{perfilModalItem.postulante?.estado_laboral === 'trabajando' ? '🔵' : '🟢'}</span>
                      {perfilModalItem.postulante?.estado_laboral === 'trabajando' ? 'Actualmente trabajando' : 'En búsqueda laboral'}
                    </span>
                    {perfilModalItem.postulante?.usuario?.telefono && (
                      <a
                        href={`tel:${perfilModalItem.postulante.usuario.telefono}`}
                        className="flex items-center gap-1 hover:text-teal-700 hover:underline"
                      >
                        <Phone className="size-3.5 text-gray-400" />
                        {perfilModalItem.postulante.usuario.telefono}
                      </a>
                    )}
                    {perfilModalItem.postulante?.usuario?.email && (
                      <a
                        href={`mailto:${perfilModalItem.postulante.usuario.email}`}
                        className="flex items-center gap-1 hover:text-teal-700 hover:underline"
                      >
                        <Mail className="size-3.5 text-gray-400" />
                        {perfilModalItem.postulante.usuario.email}
                      </a>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {perfilModalItem.cv_signed_url || (perfilModalItem.postulante?.cv_url?.startsWith('http') ? perfilModalItem.postulante.cv_url : null) ? (
                    <a
                      href={perfilModalItem.cv_signed_url || (perfilModalItem.postulante?.cv_url?.startsWith('http') ? perfilModalItem.postulante.cv_url : '#')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
                    >
                      <FileText className="size-4" />
                      <span>Abrir Currículum</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 border border-gray-200 bg-white px-3 py-1.5 rounded-xl">
                      Sin archivo de CV
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de acción rápida dentro del modal */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="text-xs text-gray-600 space-y-1.5">
                  <div>
                    <span className="font-semibold text-gray-900">Decisión municipal:</span> Seleccioná si enviar
                    este postulante a <strong>{perfilModalItem.oferta?.empresa_nombre}</strong>.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Localidad:</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-teal-900 bg-teal-50 border border-teal-200">
                      <MapPin className="size-3 text-teal-600" />
                      {perfilModalItem.postulante?.localidad || 'No informada'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {perfilModalItem.estado !== 'derivada' ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setModalDerivar(perfilModalItem)
                        setNotaDerivacion('')
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-2xs"
                    >
                      <Send className="size-3.5" />
                      <span>Enviar solicitud</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="size-3.5" />
                      Ya enviado a la empresa
                    </span>
                  )}

                  {perfilModalItem.estado !== 'rechazada_municipalidad' && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleNoEnviar(perfilModalItem.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                    >
                      <XCircle className="size-3.5" />
                      <span>No enviar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Secciones del Perfil Laboral */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Perfil Laboral y Experiencia
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100 md:col-span-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-2">
                      <MapPin className="size-4 text-teal-600" />
                      <span>Domicilio y Residencia</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block font-medium">Localidad:</span>
                        <span className="text-gray-800 font-semibold">{perfilModalItem.postulante?.localidad || 'No indicada'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Dirección:</span>
                        <span className="text-gray-800 font-semibold">{perfilModalItem.postulante?.direccion || 'No indicada'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-medium">Código Postal:</span>
                        <span className="text-gray-800 font-semibold">{perfilModalItem.postulante?.codigo_postal || 'No indicado'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1.5">
                      <GraduationCap className="size-4 text-teal-600" />
                      <span>Estudios y Formación</span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {perfilModalItem.postulante?.estudios || 'No especificado'}
                    </p>
                  </div>

                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1.5">
                      <Sparkles className="size-4 text-teal-600" />
                      <span>Cursos y Capacitaciones</span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {perfilModalItem.postulante?.cursos || 'No especificado'}
                    </p>
                  </div>

                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100 md:col-span-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1.5">
                      <Briefcase className="size-4 text-teal-600" />
                      <span>Experiencia Laboral Previa</span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {perfilModalItem.postulante?.experiencia || 'No especificada'}
                    </p>
                  </div>

                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1.5">
                      <Clock className="size-4 text-teal-600" />
                      <span>Disponibilidad Horaria</span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {perfilModalItem.postulante?.horarios || 'No especificada'}
                    </p>
                  </div>

                  <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1.5">
                      <Sparkles className="size-4 text-teal-600" />
                      <span>Idiomas y Habilidades</span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {[perfilModalItem.postulante?.idiomas, perfilModalItem.postulante?.habilidades]
                        .filter(Boolean)
                        .join(' · ') || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Agendar / Reprogramar Preentrevista                              */}
      {/* ========================================================================= */}
      {modalPreentrevista && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-blue-50/60 shrink-0">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <CalendarCheck className="size-3.5" />
                  Preentrevista Municipal (Opcional)
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">
                  {[modalPreentrevista.postulante?.usuario?.nombre, modalPreentrevista.postulante?.usuario?.apellido].filter(Boolean).join(' ') ||
                    (modalPreentrevista.postulante?.dni ? `Postulante (DNI ${modalPreentrevista.postulante.dni})` : 'Postulante registrado')}
                </h3>
                <p className="text-xs text-gray-500">
                  Oferta: {modalPreentrevista.oferta?.titulo} · {modalPreentrevista.oferta?.empresa_nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalPreentrevista(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200/50"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                <p className="font-semibold">💡 Recordá que la preentrevista no es obligatoria:</p>
                <p>
                  Si ya conocés al candidato o considerás que su perfil es idóneo, podés derivarlo directamente a la empresa sin necesidad de coordinar esta reunión.
                </p>
              </div>

              {/* Teléfono de contacto rápido para coordinar */}
              {modalPreentrevista.postulante?.usuario?.telefono && (
                <div className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-500">Teléfono para coordinar fecha y hora:</span>
                  <a
                    href={`tel:${modalPreentrevista.postulante.usuario.telefono}`}
                    className="font-bold text-teal-700 hover:underline flex items-center gap-1"
                  >
                    <Phone className="size-3.5" />
                    {modalPreentrevista.postulante.usuario.telefono}
                  </a>
                </div>
              )}

              {/* Campo Fecha y Hora acordada */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Fecha y Hora Acordada *
                </label>
                <input
                  type="datetime-local"
                  // min se establece en el instante actual para no permitir fechas pasadas
                  min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  value={formFechaHora}
                  onChange={(e) => setFormFechaHora(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-gray-400">
                  Solo podés seleccionar fechas a partir de la fecha y hora actual del sistema.
                </p>
              </div>

              {/* Campo Lugar / Modalidad */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Lugar o Modalidad
                </label>
                <input
                  type="text"
                  placeholder="Ej: Presencial en Oficina de Empleo, videollamada Meet, o telefónica"
                  value={formLugar}
                  onChange={(e) => setFormLugar(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Estado / Resultado si ya existía y si ya pasó la fecha pactada */}
              {modalPreentrevista.preentrevista && (() => {
                const fechaPactada = new Date(modalPreentrevista.preentrevista.fecha_hora)
                const yaPasoFecha = fechaPactada.getTime() <= Date.now()

                if (!yaPasoFecha) {
                  return (
                    <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                      <p className="font-semibold">🕒 Entrevista programada a futuro</p>
                      <p className="text-[11px] text-blue-700 mt-0.5">
                        La fecha acordada es para el {fechaPactada.toLocaleString('es-AR')}. La calificación de asistencia o resultado se habilitará una vez transcurrido dicho horario. Si el postulante solicitó cambiar el día/horario, podés modificar la fecha arriba para reprogramarla.
                      </p>
                    </div>
                  )
                }

                return (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      Estado / Asistencia
                    </label>
                    <select
                      value={formResultado}
                      onChange={(e) => setFormResultado(e.target.value as any)}
                      className="w-full text-xs rounded-xl border border-gray-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="pendiente">Pendiente de realizar</option>
                      <option value="aprobada">Asistió y aprobó (Favorable)</option>
                      <option value="no_asistio">No pudo asistir (Para reprogramar)</option>
                      <option value="desfavorable">No favorable</option>
                    </select>
                  </div>
                )
              })()}

              {/* Observaciones o notas internas */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Observaciones internas de la preentrevista (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Anotaciones de la entrevista, motivo de reprogramación o aspectos evaluados..."
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setModalPreentrevista(null)}
                className="text-xs font-semibold text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleGuardarPreentrevista}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs disabled:opacity-50"
              >
                {isPending ? 'Guardando...' : modalPreentrevista.preentrevista ? 'Reprogramar / Guardar' : 'Agendar Preentrevista'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
