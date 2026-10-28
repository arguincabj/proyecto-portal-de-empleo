'use client'

import { useState } from 'react'
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
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Languages,
  Sparkles,
} from 'lucide-react'

export type DerivacionPostulante = {
  derivacionId: string
  notaMunicipalidad: string | null
  estadoEmpresa: string | null
  fechaDerivacion: string
  ofertaTitulo: string
  ofertaId: string
  postulante: {
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

type Props = {
  derivaciones: DerivacionPostulante[]
}

export function DerivacionesEmpresaClient({ derivaciones }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [perfilModal, setPerfilModal] = useState<DerivacionPostulante | null>(null)

  if (derivaciones.length === 0) {
    return (
      <div className="p-12 text-center space-y-3">
        <span className="text-4xl block">📭</span>
        <h3 className="font-semibold text-gray-800">Aún no hay postulantes derivados</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Cuando la Oficina de Empleo municipal preseleccione candidatos para tus ofertas, aparecerán aquí.
        </p>
      </div>
    )
  }

  // Agrupar por oferta
  const porOferta = new Map<string, { titulo: string; ofertaId: string; items: DerivacionPostulante[] }>()
  derivaciones.forEach((d) => {
    const key = d.ofertaId
    if (!porOferta.has(key)) {
      porOferta.set(key, { titulo: d.ofertaTitulo, ofertaId: d.ofertaId, items: [] })
    }
    porOferta.get(key)!.items.push(d)
  })

  return (
    <>
      <div className="divide-y divide-gray-100">
        {Array.from(porOferta.entries()).map(([ofertaId, grupo]) => (
          <div key={ofertaId}>
            {/* Encabezado de la oferta */}
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === ofertaId ? null : ofertaId)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
            >
              <div>
                <h3 className="font-bold text-sm text-gray-900">{grupo.titulo}</h3>
                <p className="text-xs text-teal-700 font-medium mt-0.5">
                  {grupo.items.length} {grupo.items.length === 1 ? 'candidato derivado' : 'candidatos derivados'}
                </p>
              </div>
              {expandedId === ofertaId ? (
                <ChevronUp className="size-4 text-gray-400" />
              ) : (
                <ChevronDown className="size-4 text-gray-400" />
              )}
            </button>

            {/* Lista de postulantes derivados para esta oferta */}
            {expandedId === ofertaId && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {grupo.items.map((d) => {
                  const p = d.postulante
                  const nombreCompleto = [p.nombre, p.apellido].filter(Boolean).join(' ')

                  return (
                    <div key={d.derivacionId} className="px-5 py-4 bg-gray-50/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {p.nombre?.charAt(0)?.toUpperCase()}{p.apellido?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{nombreCompleto}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              {p.estado_laboral && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                  p.estado_laboral === 'trabajando'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}>
                                  {p.estado_laboral === 'trabajando' ? '🔵 Trabajando' : '🟢 En búsqueda'}
                                </span>
                              )}
                              {p.localidad && (
                                <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                  <MapPin className="size-2.5" />
                                  {p.localidad}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border capitalize ${
                            d.estadoEmpresa === 'contratado'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : d.estadoEmpresa === 'rechazado'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : d.estadoEmpresa === 'en_proceso'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {d.estadoEmpresa === 'en_proceso' ? 'En proceso' : d.estadoEmpresa || 'pendiente'}
                          </span>
                        </div>
                      </div>

                      {/* Info de contacto */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
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
                          <span className="flex items-center gap-1 text-gray-400">
                            DNI: {p.dni}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="size-3.5" />
                          Derivado: {new Date(d.fechaDerivacion).toLocaleDateString('es-AR')}
                        </span>
                      </div>

                      {/* Nota de la municipalidad */}
                      {d.notaMunicipalidad && (
                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900">
                          <strong>Nota de la Oficina Municipal:</strong> {d.notaMunicipalidad}
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPerfilModal(d)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-2xs"
                        >
                          <User className="size-3.5" />
                          Ver perfil completo
                        </button>

                        {d.cvs.length > 0 ? (
                          d.cvs.map((cv, idx) => (
                            <a
                              key={idx}
                              href={cv.signedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-2xs max-w-[220px]"
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
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Perfil Completo */}
      {perfilModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setPerfilModal(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-base">
                  {perfilModal.postulante.nombre?.charAt(0)?.toUpperCase()}{perfilModal.postulante.apellido?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {perfilModal.postulante.nombre} {perfilModal.postulante.apellido}
                  </h3>
                  <p className="text-xs text-teal-700 font-medium">
                    Postulante para: {perfilModal.ofertaTitulo}
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
              {/* Cartel explicativo de evaluación */}
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/90 text-teal-900 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-teal-950 text-sm">
                  <Sparkles className="size-4 text-teal-700" />
                  <span>Evaluación de la postulación para entrevista laboral</span>
                </div>
                <p className="text-teal-900 leading-relaxed">
                  Para coordinar o definir una entrevista con este postulante, podés gestionar su estado desde la página de candidatos de la oferta:
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
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                        perfilModal.postulante.estado_laboral === 'trabajando'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {perfilModal.postulante.estado_laboral === 'trabajando' ? '🔵 Trabajando actualmente' : '🟢 En búsqueda laboral'}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Domicilio */}
              {(perfilModal.postulante.localidad || perfilModal.postulante.direccion) && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> Domicilio
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
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
              {perfilModal.postulante.estudios && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="size-3.5" /> Estudios
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{perfilModal.postulante.estudios}</p>
                </section>
              )}

              {perfilModal.postulante.cursos && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" /> Cursos y Certificaciones
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{perfilModal.postulante.cursos}</p>
                </section>
              )}

              {perfilModal.postulante.experiencia && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Briefcase className="size-3.5" /> Experiencia Laboral
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{perfilModal.postulante.experiencia}</p>
                </section>
              )}

              {perfilModal.postulante.idiomas && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Languages className="size-3.5" /> Idiomas
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{perfilModal.postulante.idiomas}</p>
                </section>
              )}

              {perfilModal.postulante.habilidades && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> Habilidades
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{perfilModal.postulante.habilidades}</p>
                </section>
              )}

              {perfilModal.postulante.horarios && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Clock className="size-3.5" /> Disponibilidad Horaria
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{perfilModal.postulante.horarios}</p>
                </section>
              )}

              {/* CVs adjuntos */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                  <FileText className="size-3.5" /> Currículum Vitae
                </h4>
                {perfilModal.cvs.length > 0 ? (
                  <div className="space-y-2">
                    {perfilModal.cvs.map((cv, idx) => (
                      <a
                        key={idx}
                        href={cv.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-teal-50 hover:border-teal-300 transition-colors"
                      >
                        <div className="size-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                          <FileText className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{cv.nombre}</p>
                          <p className="text-xs text-gray-500">Hacer clic para abrir</p>
                        </div>
                        <ExternalLink className="size-4 text-gray-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Este postulante no tiene CVs adjuntos.</p>
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
    </>
  )
}
