'use client'

import { useState, useTransition } from 'react'
import {
  Users,
  X,
  FileText,
  Phone,
  Calendar,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Clock,
  Sparkles,
  SendHorizontal,
  CheckCircle2,
  LoaderCircle,
  IdCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { derivarPostulante } from './actions'

export type PostulanteDetalle = {
  id: string // postulacionId
  nombre: string
  apellido: string
  dni: string | null
  telefono: string
  cv_url: string | null
  cv_signed_url: string | null
  fecha_postulacion: string
  estado: string
  estudios?: string | null
  cursos?: string | null
  experiencia?: string | null
  idiomas?: string | null
  habilidades?: string | null
  horarios?: string | null
  derivada: boolean
}

type Props = {
  ofertaTitulo: string
  empresaNombre: string
  postulantes: PostulanteDetalle[]
}

export function ModalPostulantes({ ofertaTitulo, empresaNombre, postulantes }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [postulanteSeleccionado, setPostulanteSeleccionado] = useState<PostulanteDetalle | null>(null)
  const [isPending, startTransition] = useTransition()
  const [notaDerivacion, setNotaDerivacion] = useState('')

  function handleDerivar(postulacionId: string) {
    startTransition(async () => {
      const res = await derivarPostulante(postulacionId, notaDerivacion)
      if (res.ok) {
        toast.success('Postulante derivado exitosamente a la empresa')
        if (postulanteSeleccionado && postulanteSeleccionado.id === postulacionId) {
          setPostulanteSeleccionado({
            ...postulanteSeleccionado,
            estado: 'derivada',
            derivada: true,
          })
        }
      } else {
        toast.error(res.error || 'Error al derivar')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors shadow-xs"
        title="Ver postulantes a esta oferta"
      >
        <Users className="size-3.5" />
        <span>Ver postulantes ({postulantes.length})</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-gray-50/80">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  {empresaNombre}
                </span>
                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                  Postulantes a &quot;{ofertaTitulo}&quot;
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {postulanteSeleccionado
                    ? 'Detalles del perfil laboral y contacto'
                    : `Total recibidos: ${postulantes.length} postulante${postulantes.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setPostulanteSeleccionado(null)
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 overflow-y-auto flex-1">
              {postulanteSeleccionado ? (
                /* VISTA DETALLADA DEL POSTULANTE */
                <div className="space-y-6">
                  {/* Botón Volver a la lista */}
                  <button
                    type="button"
                    onClick={() => setPostulanteSeleccionado(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                  >
                    <span>← Volver al listado de postulantes</span>
                  </button>

                  {/* Tarjeta de Encabezado de Usuario */}
                  <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-black text-gray-900">
                          {postulanteSeleccionado.nombre} {postulanteSeleccionado.apellido}
                        </h4>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            postulanteSeleccionado.estado === 'derivada'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {postulanteSeleccionado.estado}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-2 font-mono">
                        {postulanteSeleccionado.dni && (
                          <span className="flex items-center gap-1">
                            <IdCard className="size-3.5 text-gray-400" />
                            DNI: {postulanteSeleccionado.dni}
                          </span>
                        )}
                        {postulanteSeleccionado.telefono ? (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3.5 text-gray-400" />
                            {postulanteSeleccionado.telefono}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Sin teléfono registrado</span>
                        )}
                        <span className="flex items-center gap-1 text-gray-400">
                          <Calendar className="size-3.5" />
                          Postulado el {postulanteSeleccionado.fecha_postulacion}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {postulanteSeleccionado.cv_signed_url ? (
                        <a
                          href={postulanteSeleccionado.cv_signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
                        >
                          <FileText className="size-4" />
                          <span>Abrir CV Adjunto</span>
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl">
                          Sin archivo de CV
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones de Derivación a la Empresa */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <SendHorizontal className="size-4 text-teal-600" />
                        <span>Derivación a la Empresa ({empresaNombre})</span>
                      </div>
                      {postulanteSeleccionado.derivada ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="size-3.5" />
                          Ya fue derivado
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500">
                      Al derivar al postulante, su perfil y currículum serán habilitados en el panel de la empresa contratante para su evaluación.
                    </p>

                    {!postulanteSeleccionado.derivada && (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          placeholder="Nota u observación opcional para la empresa..."
                          value={notaDerivacion}
                          onChange={(e) => setNotaDerivacion(e.target.value)}
                          className="w-full text-xs rounded-xl border border-gray-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        />
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDerivar(postulanteSeleccionado.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                        >
                          {isPending ? (
                            <>
                              <LoaderCircle className="size-3.5 animate-spin" />
                              <span>Derivando...</span>
                            </>
                          ) : (
                            <>
                              <SendHorizontal className="size-3.5" />
                              <span>Derivar postulante a la empresa</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Información del Perfil Laboral Cargado */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Información del Perfil Laboral
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1">
                          <GraduationCap className="size-4 text-teal-600" />
                          <span>Estudios y Formación</span>
                        </div>
                        <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                          {postulanteSeleccionado.estudios || 'No especificado'}
                        </p>
                      </div>

                      <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1">
                          <Briefcase className="size-4 text-teal-600" />
                          <span>Experiencia Laboral</span>
                        </div>
                        <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                          {postulanteSeleccionado.experiencia || 'No especificada'}
                        </p>
                      </div>

                      <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1">
                          <Sparkles className="size-4 text-teal-600" />
                          <span>Habilidades y Cursos</span>
                        </div>
                        <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                          {postulanteSeleccionado.habilidades || postulanteSeleccionado.cursos
                            ? `${postulanteSeleccionado.habilidades || ''}\n${postulanteSeleccionado.cursos || ''}`.trim()
                            : 'No especificados'}
                        </p>
                      </div>

                      <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1">
                          <Clock className="size-4 text-teal-600" />
                          <span>Disponibilidad Horaria / Idiomas</span>
                        </div>
                        <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                          {postulanteSeleccionado.horarios || postulanteSeleccionado.idiomas
                            ? `${postulanteSeleccionado.horarios || ''}\n${postulanteSeleccionado.idiomas || ''}`.trim()
                            : 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* LISTADO GENERAL DE POSTULANTES */
                <div className="divide-y divide-gray-100">
                  {postulantes.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      <Users className="size-8 text-gray-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm text-gray-700">Aún no hay postulaciones recibidas</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Cuando los postulantes apliquen a esta oferta aparecerán en este panel.
                      </p>
                    </div>
                  ) : (
                    postulantes.map((p) => (
                      <div
                        key={p.id}
                        className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 p-2 rounded-xl transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNotaDerivacion('')
                                setPostulanteSeleccionado(p)
                              }}
                              className="font-bold text-sm text-teal-800 hover:text-teal-900 hover:underline text-left"
                              title="Ver ficha completa de datos"
                            >
                              👤 {p.nombre} {p.apellido}
                            </button>
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                                p.estado === 'derivada'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {p.estado}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-mono">
                            {p.dni && <span>DNI: {p.dni}</span>}
                            {p.telefono && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <Phone className="size-3" />
                                {p.telefono}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-gray-400">
                              <Calendar className="size-3" />
                              {p.fecha_postulacion}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNotaDerivacion('')
                              setPostulanteSeleccionado(p)
                            }}
                            className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
                          >
                            Ver Perfil
                          </button>

                          {p.cv_signed_url && (
                            <a
                              href={p.cv_signed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-2xs"
                              title="Abrir CV"
                            >
                              <FileText className="size-3.5" />
                              <span>CV</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
              {postulanteSeleccionado ? (
                <button
                  type="button"
                  onClick={() => setPostulanteSeleccionado(null)}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  ← Volver a la lista
                </button>
              ) : (
                <span className="text-xs text-gray-400">Portal Municipal de Empleo</span>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setPostulanteSeleccionado(null)
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
