'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, CalendarClock, Info, AlertCircle, Check, GraduationCap, ArrowRight, CheckCircle2, Building2 } from 'lucide-react'
import { marcarNotificacionLeida, marcarTodasLeidas } from './actions'

type Notificacion = {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  metadata?: {
    fecha_hora?: string
    lugar_modalidad?: string
    postulacion_id?: string
    derivacion_id?: string
    oferta_id?: string
    postulante_id?: string
    motivo_rechazo?: string
    link?: string
    link_texto?: string
    total_rechazos?: number
  } | null
  created_at: string
}

function IconoTipo({ tipo }: { tipo: string }) {
  if (tipo === 'contratado') return <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
  if (tipo === 'entrevista') return <CalendarClock className="size-5 text-blue-600 shrink-0 mt-0.5" />
  if (tipo === 'alerta' || tipo === 'alerta_3_rechazos') return <AlertCircle className="size-5 text-rose-500 shrink-0 mt-0.5" />
  if (tipo === 'cursos') return <GraduationCap className="size-5 text-emerald-600 shrink-0 mt-0.5" />
  return <Info className="size-5 text-teal-600 shrink-0 mt-0.5" />
}

function NotificacionCard({ notif }: { notif: Notificacion }) {
  const [pending, startTransition] = useTransition()

  const handleMarcarLeida = () => {
    startTransition(() => {
      marcarNotificacionLeida(notif.id)
    })
  }

  const fechaCreacion = new Date(notif.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors ${
        notif.leida
          ? 'border-gray-200 bg-white'
          : 'border-blue-200 bg-blue-50/60 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <IconoTipo tipo={notif.tipo} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className={`text-sm font-semibold ${notif.leida ? 'text-gray-700' : 'text-gray-900'}`}>
              {notif.titulo}
            </p>
            {!notif.leida && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wide shrink-0">
                Nueva
              </span>
            )}
          </div>
          <p className={`mt-1 text-sm leading-relaxed ${notif.leida ? 'text-gray-500' : 'text-gray-700'}`}>
            {notif.mensaje}
          </p>

          {notif.metadata?.link && (
            <div className="mt-3">
              <Link
                href={notif.metadata.link}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-all hover:scale-[1.02]"
              >
                {notif.metadata?.link?.includes('/admin/empresas') ? <Building2 className="size-4" /> : <GraduationCap className="size-4" />}
                <span>{notif.metadata.link_texto || (notif.metadata?.link?.includes('/admin/empresas') ? 'Ir a aprobación de empresas' : 'Ir a Cursos y Videos')}</span>
                <ArrowRight className="size-3.5 ml-0.5" />
              </Link>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-400">{fechaCreacion}</p>
        </div>
      </div>

      {!notif.leida && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleMarcarLeida}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <Check className="size-3.5" />
            Marcar como leída
          </button>
        </div>
      )}
    </div>
  )
}

export function NotificacionesClient({ notificaciones }: { notificaciones: Notificacion[] }) {
  const [pending, startTransition] = useTransition()
  const hayNoLeidas = notificaciones.some((n) => !n.leida)

  const handleMarcarTodas = () => {
    startTransition(() => {
      marcarTodasLeidas()
    })
  }

  if (notificaciones.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Bell className="size-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900">Sin notificaciones</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
          Acá aparecerán los avisos sobre entrevistas y novedades de tus postulaciones.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {hayNoLeidas && (
        <div className="flex justify-end">
          <button
            onClick={handleMarcarTodas}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <CheckCheck className="size-4" />
            Marcar todas como leídas
          </button>
        </div>
      )}
      {notificaciones.map((notif) => (
        <NotificacionCard key={notif.id} notif={notif} />
      ))}
    </div>
  )
}
