'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { postularAOferta } from '../actions'
import { CheckCircle2, LoaderCircle, FileText, UserCheck } from 'lucide-react'

interface BotonPostularProps {
  ofertaId: string
  isAuthenticated: boolean
  userRole: string | null
  yaPostulado: boolean
  estadoPostulacion?: string | null
  estadoLaboral?: string | null
  cvsDisponibles?: Array<{ id: string; nombre: string }>
}

const ESTADOS_MAP: Record<string, { label: string; class: string }> = {
  recibida: { label: 'Recibida', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  en_revision: { label: 'En revisión', class: 'bg-amber-100 text-amber-800 border-amber-200' },
  derivada: { label: 'Derivada a la empresa', class: 'bg-purple-100 text-purple-800 border-purple-200' },
  rechazada_municipalidad: { label: 'No seleccionada', class: 'bg-red-100 text-red-800 border-red-200' },
}

export function BotonPostular({
  ofertaId,
  isAuthenticated,
  userRole,
  yaPostulado: initialYaPostulado,
  estadoPostulacion,
  estadoLaboral,
  cvsDisponibles = [],
}: BotonPostularProps) {
  const [yaPostulado, setYaPostulado] = useState(initialYaPostulado)
  const [isPending, startTransition] = useTransition()

  // Selección de CV: por defecto el primer CV disponible o "perfil_solamente"
  const [cvSeleccionado, setCvSeleccionado] = useState<string>(
    cvsDisponibles.length > 0 ? cvsDisponibles[0].id : 'perfil_solamente'
  )

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl bg-surface border border-border/60 p-6 text-center space-y-3 shadow-card">
        <h4 className="font-bold text-foreground text-base">¿Te interesa esta oportunidad?</h4>
        <p className="text-sm text-foreground-secondary max-w-md mx-auto">
          Iniciá sesión o creá tu cuenta de postulante para enviar tu CV y postularte con un solo clic.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            href={`/auth/login?redirect=/ofertas/${ofertaId}`}
            className="bg-primary-600 text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/registro/postulante"
            className="bg-surface text-primary-600 font-semibold text-xs px-5 py-2.5 rounded-xl border border-primary-300 hover:bg-primary-50 transition-colors"
          >
            Registrarme como postulante
          </Link>
        </div>
      </div>
    )
  }

  if (userRole !== 'postulante') {
    return (
      <div className="rounded-xl bg-surface border border-border/60 p-5 text-center text-sm text-foreground-secondary shadow-card">
        Estás conectado con una cuenta de <strong className="capitalize text-foreground">{userRole}</strong>. Las postulaciones a ofertas están reservadas para usuarios con cuenta de postulante.
      </div>
    )
  }

  if (yaPostulado) {
    const estadoInfo = estadoPostulacion ? ESTADOS_MAP[estadoPostulacion] : null
    return (
      <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-card">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-emerald-950 text-base">Ya te has postulado a este puesto</h4>
            <p className="text-sm text-emerald-800">
              Tu postulación fue registrada en el sistema de empleo municipal.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {estadoInfo && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-800 font-medium">Estado:</span>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${estadoInfo.class}`}>
                {estadoInfo.label}
              </span>
            </div>
          )}
          {estadoLaboral && (
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
              estadoLaboral === 'trabajando'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
            }`}>
              {estadoLaboral === 'trabajando' ? '🔵 Trabajando' : '🟢 En búsqueda'}
            </span>
          )}
        </div>
      </div>
    )
  }

  const handlePostular = () => {
    startTransition(async () => {
      const result = await postularAOferta(ofertaId, cvSeleccionado)
      if (result.ok) {
        setYaPostulado(true)
        toast.success('¡Postulación enviada con éxito!')
      } else {
        toast.error(result.error ?? 'No se pudo enviar la postulación.')
      }
    })
  }

  return (
    <div className="rounded-xl bg-surface border border-border/60 p-6 shadow-card space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-4">
        <div>
          <h4 className="font-bold text-foreground text-lg">¿Cumplís con los requisitos?</h4>
          <p className="text-sm text-foreground-secondary mt-0.5">
            Elegí cómo querés presentarte ante la Oficina de Empleo para esta oportunidad laboral.
          </p>
        </div>
        {estadoLaboral && (
          <div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
              estadoLaboral === 'trabajando'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <span>{estadoLaboral === 'trabajando' ? '🔵' : '🟢'}</span>
              <span>{estadoLaboral === 'trabajando' ? 'Actualmente trabajando' : 'En búsqueda laboral'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Selector de CV o Perfil */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
          Seleccioná el currículum para adjuntar a tu postulación:
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Opción 1: Datos de perfil */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              cvSeleccionado === 'perfil_solamente'
                ? 'border-primary-600 bg-primary-50/50 ring-1 ring-primary-600/30'
                : 'border-border bg-surface-muted hover:border-border-hover'
            }`}
          >
            <input
              type="radio"
              name="cv_seleccion"
              value="perfil_solamente"
              checked={cvSeleccionado === 'perfil_solamente'}
              onChange={() => setCvSeleccionado('perfil_solamente')}
              className="mt-1 text-primary-600 focus:ring-primary-500"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <UserCheck className="size-4 text-primary-600 shrink-0" />
                <span>Solo datos de mi perfil</span>
              </div>
              <p className="text-xs text-foreground-secondary mt-1">
                Usar mi experiencia, estudios, habilidades y datos cargados en el perfil.
              </p>
            </div>
          </label>

          {/* Opciones de CVs cargados */}
          {cvsDisponibles.map((cv) => (
            <label
              key={cv.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                cvSeleccionado === cv.id
                  ? 'border-primary-600 bg-primary-50/50 ring-1 ring-primary-600/30'
                : 'border-border bg-surface-muted hover:border-border-hover'
              }`}
            >
              <input
                type="radio"
                name="cv_seleccion"
                value={cv.id}
                checked={cvSeleccionado === cv.id}
                onChange={() => setCvSeleccionado(cv.id)}
                className="mt-1 text-primary-600 focus:ring-primary-500"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                  <FileText className="size-4 text-primary-600 shrink-0" />
                  <span className="truncate" title={cv.nombre}>{cv.nombre}</span>
                </div>
                <p className="text-xs text-foreground-secondary mt-1">
                  Adjuntar este archivo CV específico junto con tu perfil.
                </p>
              </div>
            </label>
          ))}
        </div>

        {cvsDisponibles.length === 0 && (
          <p className="text-xs text-foreground-secondary">
            💡 Podés subir hasta 3 CVs en tu{' '}
            <Link href="/perfil" className="text-primary-600 font-semibold underline hover:text-primary-700">
              Perfil
            </Link>{' '}
            para elegir cuál adjuntar a cada oferta.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-xs text-foreground-muted">
          Al hacer clic, tu postulación quedará registrada inmediatamente.
        </p>

        <button
          type="button"
          onClick={handlePostular}
          disabled={isPending}
          className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs px-7 py-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <LoaderCircle className="size-4 motion-safe:animate-spin" />
              <span>Enviando postulación...</span>
            </>
          ) : (
            <span>Postularme ahora</span>
          )}
        </button>
      </div>
    </div>
  )
}
