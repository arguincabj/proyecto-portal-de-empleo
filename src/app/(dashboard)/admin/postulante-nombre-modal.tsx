'use client'

import { useState, useTransition } from 'react'
import {
  X,
  FileText,
  Phone,
  Mail,
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

export type PostulanteFicha = {
  id: string // postulacionId
  nombre: string
  apellido: string
  email: string | null
  dni: string | null
  telefono: string
  cv_url: string | null
  cv_signed_url: string | null
  fecha_postulacion: string
  estado: string
  tituloOferta: string
  empresaNombre: string
  estudios?: string | null
  cursos?: string | null
  experiencia?: string | null
  idiomas?: string | null
  habilidades?: string | null
  horarios?: string | null
  derivada: boolean
}

type Props = {
  postulante: PostulanteFicha
}

export function PostulanteNombreModal({ postulante }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [notaDerivacion, setNotaDerivacion] = useState('')
  const [derivadaState, setDerivadaState] = useState(postulante.derivada)

  function handleDerivar() {
    startTransition(async () => {
      const res = await derivarPostulante(postulante.id, notaDerivacion)
      if (res.ok) {
        toast.success('Postulante derivado exitosamente a la empresa')
        setDerivadaState(true)
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
        className="font-bold text-sm text-gray-900 hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
        title="Tocar para ver datos completos de contacto y derivar"
      >
        {postulante.nombre} {postulante.apellido}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-gray-50/80">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Ficha del Postulante
                </span>
                <h3 className="text-xl font-black text-gray-900">
                  {postulante.nombre} {postulante.apellido}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Postulado a &quot;{postulante.tituloOferta}&quot; · {postulante.empresaNombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Contenido / Datos de Contacto y Perfil */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Tarjeta de Contacto Directo */}
              <div className="bg-teal-50/60 rounded-2xl p-5 border border-teal-100/90 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                    Datos de Contacto
                  </h4>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      derivadaState
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}
                  >
                    {derivadaState ? 'Derivada' : postulante.estado}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
                  {postulante.email && (
                    <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-teal-100">
                      <Mail className="size-4 text-teal-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Correo Electrónico</p>
                        <a href={`mailto:${postulante.email}`} className="font-mono font-medium hover:underline text-teal-900">
                          {postulante.email}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-teal-100">
                    <Phone className="size-4 text-teal-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Teléfono / WhatsApp</p>
                      {postulante.telefono ? (
                        <a href={`tel:${postulante.telefono}`} className="font-mono font-medium hover:underline text-teal-900">
                          {postulante.telefono}
                        </a>
                      ) : (
                        <span className="italic text-gray-400">Sin teléfono</span>
                      )}
                    </div>
                  </div>

                  {postulante.dni && (
                    <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-teal-100">
                      <IdCard className="size-4 text-teal-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Documento (DNI)</p>
                        <p className="font-mono font-medium text-gray-800">{postulante.dni}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-teal-100">
                    <Calendar className="size-4 text-teal-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Fecha de Postulación</p>
                      <p className="font-mono font-medium text-gray-800">{postulante.fecha_postulacion}</p>
                    </div>
                  </div>
                </div>

                {/* Acceso al CV adjunto */}
                <div className="pt-1">
                  {postulante.cv_signed_url ? (
                    <a
                      href={postulante.cv_signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
                    >
                      <FileText className="size-4" />
                      <span>Abrir o descargar CV adjunto</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <p className="text-xs text-gray-400 italic">El postulante no adjuntó archivo de CV en su perfil.</p>
                  )}
                </div>
              </div>

              {/* Módulo de Derivación */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <SendHorizontal className="size-4 text-teal-600" />
                    <span>Derivar a la Empresa ({postulante.empresaNombre})</span>
                  </div>
                  {derivadaState ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="size-3.5" />
                      Ya derivado
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500">
                  Al derivarlo, la empresa podrá visualizar sus datos y currículum en su respectivo panel.
                </p>

                {!derivadaState && (
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
                      onClick={handleDerivar}
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

              {/* Información laboral complementaria */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Datos del Perfil Laboral
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1">
                      <GraduationCap className="size-3.5 text-teal-600" />
                      <span>Estudios</span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                      {postulante.estudios || 'No especificado'}
                    </p>
                  </div>

                  <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1">
                      <Briefcase className="size-3.5 text-teal-600" />
                      <span>Experiencia</span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                      {postulante.experiencia || 'No especificada'}
                    </p>
                  </div>

                  <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1">
                      <Sparkles className="size-3.5 text-teal-600" />
                      <span>Habilidades / Cursos</span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                      {postulante.habilidades || postulante.cursos
                        ? `${postulante.habilidades || ''}\n${postulante.cursos || ''}`.trim()
                        : 'No especificados'}
                    </p>
                  </div>

                  <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1">
                      <Clock className="size-3.5 text-teal-600" />
                      <span>Disponibilidad / Idiomas</span>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                      {postulante.horarios || postulante.idiomas
                        ? `${postulante.horarios || ''}\n${postulante.idiomas || ''}`.trim()
                        : 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
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
