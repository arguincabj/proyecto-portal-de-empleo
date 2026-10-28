'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  User,
  FileText,
  ExternalLink,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  MapPin,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Languages,
  Sparkles,
  ArrowLeft,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { actualizarEstadoDerivacion } from '../../../actions'

export type CandidatoDerivado = {
  derivacionId: string
  notaMunicipalidad: string | null
  estadoEmpresa: 'pendiente' | 'en_proceso' | 'contratado' | 'rechazado' | string
  notaEmpresa: string | null
  fechaDerivacion: string
  postulante: {
    id: string
    nombre: string
    apellido: string
    email: string | null
    telefono: string | null
    dni: string | null
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
  }
  cvs: Array<{
    nombre: string
    signedUrl: string
  }>
}

export type OfertaConDerivados = {
  id: string
  titulo: string
  descripcion: string
  estado: string
  created_at: string
  empresaNombre: string
}

type Props = {
  oferta: OfertaConDerivados
  candidatos: CandidatoDerivado[]
}

const ESTADOS_MAP: Record<string, { label: string; badgeClass: string; icon: typeof CheckCircle2 }> = {
  pendiente: {
    label: 'Pendiente de evaluación',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: Clock,
  },
  en_proceso: {
    label: 'En revisión / Entrevista',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock,
  },
  contratado: {
    label: 'Solicitud aceptada',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  rechazado: {
    label: 'Solicitud denegada',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    icon: XCircle,
  },
}

export function OfertaCandidatosClient({ oferta, candidatos: initialCandidatos }: Props) {
  const [candidatos, setCandidatos] = useState<CandidatoDerivado[]>(initialCandidatos)
  const [perfilModal, setPerfilModal] = useState<CandidatoDerivado | null>(null)
  const [modalConfirmacion, setModalConfirmacion] = useState<{
    candidato: CandidatoDerivado
    nuevoEstado: 'en_proceso' | 'contratado' | 'rechazado'
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [candidatoActualizando, setCandidatoActualizando] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'en_proceso' | 'contratado' | 'rechazado'>('todos')

  const candidatosFiltrados = candidatos.filter((c) => {
    if (filtroEstado === 'todos') return true
    return (c.estadoEmpresa || 'pendiente') === filtroEstado
  })

  const cambiarEstado = (
    derivacionId: string,
    nuevoEstado: 'pendiente' | 'en_proceso' | 'contratado' | 'rechazado'
  ) => {
    setCandidatoActualizando(derivacionId)
    startTransition(async () => {
      try {
        const result = await actualizarEstadoDerivacion(derivacionId, nuevoEstado)
        if (result.ok) {
          setCandidatos((prev) =>
            prev.map((c) =>
              c.derivacionId === derivacionId ? { ...c, estadoEmpresa: nuevoEstado } : c
            )
          )
          const labels: Record<string, string> = {
            contratado: 'Solicitud aceptada exitosamente',
            rechazado: 'Solicitud denegada',
            en_proceso: 'Candidato puesto en revisión',
            pendiente: 'Estado restablecido a pendiente',
          }
          toast.success(labels[nuevoEstado] || 'Estado actualizado')
        } else {
          toast.error(result.error || 'No se pudo actualizar el estado')
        }
      } catch {
        toast.error('Error al actualizar el estado del postulante')
      } finally {
        setCandidatoActualizando(null)
      }
    })
  }

  const conteo = {
    total: candidatos.length,
    pendientes: candidatos.filter((c) => (c.estadoEmpresa || 'pendiente') === 'pendiente').length,
    en_proceso: candidatos.filter((c) => c.estadoEmpresa === 'en_proceso').length,
    aceptados: candidatos.filter((c) => c.estadoEmpresa === 'contratado').length,
    denegados: candidatos.filter((c) => c.estadoEmpresa === 'rechazado').length,
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Botón Volver */}
      <div>
        <Link
          href="/empresa"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-teal-700 transition-colors bg-white px-3.5 py-2 rounded-xl shadow-xs border border-gray-200"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver al panel de empresa</span>
        </Link>
      </div>

      {/* Encabezado de la Oferta */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                {oferta.empresaNombre}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  oferta.estado === 'publicada'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : oferta.estado === 'pendiente'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {oferta.estado === 'publicada'
                  ? 'Publicada'
                  : oferta.estado === 'pendiente'
                  ? 'Pendiente'
                  : oferta.estado === 'cerrada'
                  ? 'Cerrada'
                  : oferta.estado}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {oferta.titulo}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Postulantes derivados y recomendados por la Dirección de Empleo Municipal para esta búsqueda.
            </p>
          </div>

          <Link
            href={`/ofertas/${oferta.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-teal-50 hover:text-teal-700 px-4 py-2.5 rounded-xl border border-gray-200 transition-colors shrink-0"
          >
            <span>Ver oferta en portal</span>
            <ExternalLink className="size-3.5" />
          </Link>
        </div>

        {/* Resumen numérico */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs text-gray-500 block">Total derivados</span>
            <span className="text-xl font-bold text-gray-900">{conteo.total}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
            <span className="text-xs text-amber-800 block">En revisión</span>
            <span className="text-xl font-bold text-amber-900">{conteo.en_proceso}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-xs text-emerald-800 block">Aceptados</span>
            <span className="text-xl font-bold text-emerald-900">{conteo.aceptados}</span>
          </div>
          <div className="p-3 rounded-xl bg-red-50/60 border border-red-100">
            <span className="text-xs text-red-800 block">Denegados</span>
            <span className="text-xl font-bold text-red-900">{conteo.denegados}</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-500 mr-1">Filtrar:</span>
        <button
          type="button"
          onClick={() => setFiltroEstado('todos')}
          className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all border ${
            filtroEstado === 'todos'
              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Todos ({conteo.total})
        </button>
        <button
          type="button"
          onClick={() => setFiltroEstado('pendiente')}
          className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all border ${
            filtroEstado === 'pendiente'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Pendientes ({conteo.pendientes})
        </button>
        <button
          type="button"
          onClick={() => setFiltroEstado('en_proceso')}
          className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all border ${
            filtroEstado === 'en_proceso'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          En revisión ({conteo.en_proceso})
        </button>
        <button
          type="button"
          onClick={() => setFiltroEstado('contratado')}
          className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all border ${
            filtroEstado === 'contratado'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Aceptados ({conteo.aceptados})
        </button>
        <button
          type="button"
          onClick={() => setFiltroEstado('rechazado')}
          className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all border ${
            filtroEstado === 'rechazado'
              ? 'bg-red-600 text-white border-red-600 shadow-xs'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Denegados ({conteo.denegados})
        </button>
      </div>

      {/* Listado de Candidatos */}
      {candidatosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center space-y-3">
          <span className="text-4xl block">👥</span>
          <h3 className="font-bold text-gray-800 text-base">No hay postulantes en esta categoría</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {candidatos.length === 0
              ? 'La Oficina de Empleo aún no ha derivado candidatos para esta oferta laboral.'
              : 'No hay candidatos con el filtro de estado seleccionado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidatosFiltrados.map((c) => {
            const p = c.postulante
            const nombreCompleto = [p.nombre, p.apellido].filter(Boolean).join(' ')
            const estadoActual = (c.estadoEmpresa as keyof typeof ESTADOS_MAP) || 'pendiente'
            const estadoInfo = ESTADOS_MAP[estadoActual] || ESTADOS_MAP.pendiente
            const ocupado = isPending && candidatoActualizando === c.derivacionId

            return (
              <div
                key={c.derivacionId}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 transition-all hover:border-gray-200"
              >
                {/* Cabecera del Candidato */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="size-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                      {p.nombre?.charAt(0)?.toUpperCase()}
                      {p.apellido?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-gray-900">{nombreCompleto}</h3>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${estadoInfo.badgeClass}`}
                        >
                          <estadoInfo.icon className="size-3" />
                          <span>{estadoInfo.label}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {p.estado_laboral && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                              p.estado_laboral === 'trabajando'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {p.estado_laboral === 'trabajando' ? '🔵 Trabajando actualmente' : '🟢 En búsqueda'}
                          </span>
                        )}
                        {p.localidad && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="size-3 text-gray-400" />
                            {p.localidad}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="size-3" />
                          Derivado: {new Date(c.fechaDerivacion).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción de Estado: ACEPTAR, DENEGAR, EN REVISIÓN */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0">
                    {estadoActual === 'contratado' ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <span>Aceptado/a</span>
                      </span>
                    ) : estadoActual === 'en_proceso' ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                        <Clock className="size-4 text-amber-600" />
                        <span>En revisión / Entrevista</span>
                      </span>
                    ) : estadoActual === 'rechazado' ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-100 text-red-800 border border-red-300 shadow-2xs">
                        <XCircle className="size-4 text-red-600" />
                        <span>Denegado/a</span>
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => setModalConfirmacion({ candidato: c, nuevoEstado: 'contratado' })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-50 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-600 hover:text-white"
                          title="Aceptar este candidato para el puesto"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Aceptar solicitud</span>
                        </button>

                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => setModalConfirmacion({ candidato: c, nuevoEstado: 'en_proceso' })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-50 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-600 hover:text-white"
                          title="Poner al candidato en evaluación o entrevista"
                        >
                          <Clock className="size-3.5" />
                          <span>En revisión</span>
                        </button>

                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => setModalConfirmacion({ candidato: c, nuevoEstado: 'rechazado' })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-50 bg-red-50 text-red-800 border border-red-200 hover:bg-red-600 hover:text-white"
                          title="Denegar la postulación del candidato"
                        >
                          <XCircle className="size-3.5" />
                          <span>Denegar solicitud</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Nota enviada por la Oficina Municipal si existe */}
                {c.notaMunicipalidad && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="size-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Observación de la Oficina Municipal de Empleo:</strong>{' '}
                      {c.notaMunicipalidad}
                    </div>
                  </div>
                )}

                {/* Contacto y Botones de Perfil / CV */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="flex items-center gap-1 hover:text-teal-700 hover:underline">
                        <Mail className="size-3.5 text-gray-400" />
                        {p.email}
                      </a>
                    )}
                    {p.telefono && (
                      <a href={`tel:${p.telefono}`} className="flex items-center gap-1 hover:text-teal-700 hover:underline">
                        <Phone className="size-3.5 text-gray-400" />
                        {p.telefono}
                      </a>
                    )}
                    {p.dni && (
                      <span className="text-gray-400">DNI: {p.dni}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botón Ver Perfil Completo */}
                    <button
                      type="button"
                      onClick={() => setPerfilModal(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-2xs"
                    >
                      <User className="size-3.5" />
                      <span>Ver perfil completo</span>
                    </button>

                    {/* Botones de CVs */}
                    {c.cvs.length > 0 ? (
                      c.cvs.map((cv, idx) => (
                        <a
                          key={idx}
                          href={cv.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-2xs max-w-[200px]"
                          title={cv.nombre}
                        >
                          <FileText className="size-3.5 shrink-0" />
                          <span className="truncate">{cv.nombre}</span>
                          <ExternalLink className="size-3 text-gray-400 shrink-0" />
                        </a>
                      ))
                    ) : (
                      <span className="text-[11px] text-gray-400 border border-gray-200 px-2 py-1 rounded-lg">
                        Sin CV adjunto
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Perfil Completo del Postulante */}
      {perfilModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setPerfilModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-base">
                  {perfilModal.postulante.nombre?.charAt(0)?.toUpperCase()}
                  {perfilModal.postulante.apellido?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {perfilModal.postulante.nombre} {perfilModal.postulante.apellido}
                  </h3>
                  <p className="text-xs text-teal-700 font-medium">
                    Candidato postulado a: {oferta.titulo}
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

            <div className="p-6 space-y-6">
              {/* Cartel explicativo de evaluación de entrevista */}
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/90 text-teal-900 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-teal-950 text-sm">
                  <Sparkles className="size-4 text-teal-700" />
                  <span>Evaluación de la postulación para entrevista laboral</span>
                </div>
                <p className="text-teal-900 leading-relaxed">
                  Para coordinar o definir una entrevista con este postulante, seleccioná una de las siguientes opciones:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-teal-200/60 font-medium">
                  <li className="flex items-start gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong className="text-emerald-900">Aceptar:</strong> El perfil es adecuado y se lo convoca a entrevista o incorporación.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong className="text-amber-900">En revisión:</strong> Su perfil está bajo análisis interno para una posible entrevista.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="size-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span><strong className="text-red-900">Denegar:</strong> No cumple con el perfil requerido y no se avanzará con entrevista.</span>
                  </li>
                </ul>
              </div>

              {/* Estado de la postulación dentro del modal */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Estado de la solicitud:</span>
                  <span className="text-sm font-bold text-gray-900 capitalize">
                    {ESTADOS_MAP[perfilModal.estadoEmpresa || 'pendiente']?.label || perfilModal.estadoEmpresa}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {perfilModal.estadoEmpresa === 'contratado' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      <span>Aceptado/a</span>
                    </span>
                  ) : perfilModal.estadoEmpresa === 'en_proceso' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <Clock className="size-3.5 text-amber-600" />
                      <span>En revisión / Entrevista</span>
                    </span>
                  ) : perfilModal.estadoEmpresa === 'rechazado' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                      <XCircle className="size-3.5 text-red-600" />
                      <span>Denegado/a</span>
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setModalConfirmacion({ candidato: perfilModal, nuevoEstado: 'contratado' })
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Aceptar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalConfirmacion({ candidato: perfilModal, nuevoEstado: 'en_proceso' })
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        En revisión
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalConfirmacion({ candidato: perfilModal, nuevoEstado: 'rechazado' })
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-red-600 hover:bg-red-700 text-white"
                      >
                        Denegar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Datos de contacto */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Datos de Contacto</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {perfilModal.postulante.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-gray-400 shrink-0" />
                      <a href={`mailto:${perfilModal.postulante.email}`} className="text-teal-700 hover:underline truncate">
                        {perfilModal.postulante.email}
                      </a>
                    </div>
                  )}
                  {perfilModal.postulante.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-gray-400 shrink-0" />
                      <a href={`tel:${perfilModal.postulante.telefono}`} className="text-teal-700 hover:underline">
                        {perfilModal.postulante.telefono}
                      </a>
                    </div>
                  )}
                  {perfilModal.postulante.dni && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-xs font-semibold text-gray-400 w-10">DNI</span>
                      {perfilModal.postulante.dni}
                    </div>
                  )}
                  {perfilModal.postulante.estado_laboral && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                          perfilModal.postulante.estado_laboral === 'trabajando'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {perfilModal.postulante.estado_laboral === 'trabajando'
                          ? '🔵 Trabajando actualmente'
                          : '🟢 En búsqueda laboral'}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Domicilio */}
              {(perfilModal.postulante.localidad || perfilModal.postulante.direccion) && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> Domicilio
                  </h4>
                  <div className="text-sm text-gray-700 space-y-0.5">
                    {perfilModal.postulante.direccion && <p>{perfilModal.postulante.direccion}</p>}
                    {(perfilModal.postulante.localidad || perfilModal.postulante.codigo_postal) && (
                      <p>
                        {perfilModal.postulante.localidad}
                        {perfilModal.postulante.codigo_postal && ` (CP ${perfilModal.postulante.codigo_postal})`}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Perfil laboral */}
              {perfilModal.postulante.estudios ? (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="size-3.5" /> Estudios
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {perfilModal.postulante.estudios}
                  </p>
                </section>
              ) : null}

              {perfilModal.postulante.cursos ? (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" /> Cursos y Certificaciones
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {perfilModal.postulante.cursos}
                  </p>
                </section>
              ) : null}

              {perfilModal.postulante.experiencia ? (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Briefcase className="size-3.5" /> Experiencia Laboral
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {perfilModal.postulante.experiencia}
                  </p>
                </section>
              ) : null}

              {perfilModal.postulante.idiomas ? (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Languages className="size-3.5" /> Idiomas
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {perfilModal.postulante.idiomas}
                  </p>
                </section>
              ) : null}

              {perfilModal.postulante.habilidades ? (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Habilidades
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {perfilModal.postulante.habilidades}
                  </p>
                </section>
              ) : null}

              {perfilModal.postulante.horarios ? (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Clock className="size-3.5" /> Disponibilidad Horaria
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {perfilModal.postulante.horarios}
                  </p>
                </section>
              ) : null}

              {/* Mensaje de perfil básico si no completó campos laborales */}
              {!perfilModal.postulante.estudios &&
                !perfilModal.postulante.cursos &&
                !perfilModal.postulante.experiencia &&
                !perfilModal.postulante.idiomas &&
                !perfilModal.postulante.habilidades &&
                !perfilModal.postulante.horarios && (
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 text-xs text-gray-500">
                    <p className="font-medium text-gray-700">El candidato no cargó detalles de trayectoria en su perfil laboral aún.</p>
                    <p className="mt-0.5">Podés consultar su currículum adjunto o contactarlo mediante los canales de contacto superiores para entrevistarlo.</p>
                  </div>
                )}

              {/* CVs adjuntos */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                  <FileText className="size-3.5" /> Currículum Vitae Adjunto
                </h4>
                {perfilModal.cvs.length > 0 ? (
                  <div className="space-y-2">
                    {perfilModal.cvs.map((cv, idx) => (
                      <a
                        key={idx}
                        href={cv.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-teal-50 hover:border-teal-300 transition-colors"
                      >
                        <div className="size-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                          <FileText className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{cv.nombre}</p>
                          <p className="text-xs text-gray-500">Abrir archivo en pestaña nueva</p>
                        </div>
                        <ExternalLink className="size-4 text-gray-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    Este postulante no tiene archivos CV adjuntos (utilizó los datos de su perfil).
                  </p>
                )}
              </section>

              {/* Nota de la municipalidad */}
              {perfilModal.notaMunicipalidad && (
                <section className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-amber-900 mb-1">Nota de la Oficina de Empleo Municipal</h4>
                  <p className="text-sm text-amber-800">{perfilModal.notaMunicipalidad}</p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMACIÓN DE ACCIÓN (ACEPTAR, EN REVISIÓN, DENEGAR)         */}
      {/* ========================================================================= */}
      {modalConfirmacion && (() => {
        const c = modalConfirmacion.candidato
        const nombre = [c.postulante.nombre, c.postulante.apellido].filter(Boolean).join(' ') || 'este/a candidato/a'
        const estado = modalConfirmacion.nuevoEstado

        const infoConfig = {
          contratado: {
            titulo: '¿Confirmás aceptar esta solicitud?',
            descripcion: `Estás a punto de aceptar la solicitud de ${nombre} para el puesto "${oferta.titulo}". Esta decisión quedará asentada y no podrás volver a cambiarla.`,
            botonTexto: 'Sí, confirmar aceptación',
            botonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
            badge: 'Aceptado/a',
            badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            icono: CheckCircle2,
          },
          en_proceso: {
            titulo: '¿Confirmás poner en revisión / entrevista?',
            descripcion: `Estás a punto de pasar a ${nombre} a etapa de revisión y entrevista interna. Esta decisión quedará guardada como definitiva.`,
            botonTexto: 'Sí, poner en revisión',
            botonColor: 'bg-amber-600 hover:bg-amber-700 text-white',
            badge: 'En revisión / Entrevista',
            badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
            icono: Clock,
          },
          rechazado: {
            titulo: '¿Confirmás denegar esta solicitud?',
            descripcion: `Estás a punto de denegar la postulación de ${nombre} para esta oferta. Esta acción no se puede deshacer.`,
            botonTexto: 'Sí, denegar solicitud',
            botonColor: 'bg-red-600 hover:bg-red-700 text-white',
            badge: 'Denegado/a',
            badgeClass: 'bg-red-100 text-red-800 border-red-300',
            icono: XCircle,
          },
        }[estado]

        const Icono = infoConfig.icono

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div
              className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    estado === 'contratado'
                      ? 'bg-emerald-100 text-emerald-700'
                      : estado === 'en_proceso'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <Icono className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {infoConfig.titulo}
                    </h3>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border mt-1 ${infoConfig.badgeClass}`}>
                      Quedará marcado como: {infoConfig.badge}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  {infoConfig.descripcion}
                </p>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalConfirmacion(null)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      cambiarEstado(c.derivacionId, estado)
                      if (perfilModal && perfilModal.derivacionId === c.derivacionId) {
                        setPerfilModal({ ...perfilModal, estadoEmpresa: estado })
                      }
                      setModalConfirmacion(null)
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${infoConfig.botonColor}`}
                  >
                    {isPending ? 'Guardando...' : infoConfig.botonTexto}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
