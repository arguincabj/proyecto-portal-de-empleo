'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Bell,
  CalendarClock,
  Info,
  AlertCircle,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

type Notificacion = {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  created_at: string
}

function IconoTipo({ tipo }: { tipo: string }) {
  if (tipo === 'contratado') return <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
  if (tipo === 'entrevista') return <CalendarClock className="size-4 text-blue-400 shrink-0 mt-0.5" />
  if (tipo === 'alerta' || tipo === 'alerta_3_rechazos') return <AlertCircle className="size-4 text-rose-400 shrink-0 mt-0.5" />
  if (tipo === 'cursos') return <GraduationCap className="size-4 text-emerald-400 shrink-0 mt-0.5" />
  return <Info className="size-4 text-teal-400 shrink-0 mt-0.5" />
}

type Props = {
  noLeidas: number
  notificaciones: Notificacion[]
}

export function NotificacionesPopover({ noLeidas, notificaciones }: Props) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  const recientes = notificaciones.slice(0, 5)

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Botón de notificaciones */}
      <Link
        href="/notificaciones"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover transition-colors w-full"
      >
        <Bell className="size-4 shrink-0" />
        <span className="flex-1">Notificaciones</span>
        {noLeidas > 0 && (
          <span className="ml-auto inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {noLeidas}
          </span>
        )}
      </Link>

      {/* Panel flotante al hacer hover */}
      {open && (
        <div
          className="absolute bottom-0 left-full ml-2 z-50 w-80 rounded-xl border border-white/10 bg-[#1a3a2a] shadow-2xl overflow-hidden before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-3 before:content-['']"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Encabezado */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-sidebar-muted" />
              <span className="text-sm font-semibold text-sidebar-foreground">Notificaciones</span>
              {noLeidas > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white min-w-[1.125rem]">
                  {noLeidas}
                </span>
              )}
            </div>
            <Link
              href="/notificaciones"
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-72 overflow-y-auto">
            {recientes.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Bell className="size-8 text-sidebar-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs text-sidebar-muted">Sin notificaciones</p>
              </div>
            ) : (
              recientes.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 ${
                    !notif.leida ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <IconoTipo tipo={notif.tipo} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-semibold truncate ${notif.leida ? 'text-sidebar-muted' : 'text-sidebar-foreground'}`}>
                          {notif.titulo}
                        </p>
                        {!notif.leida && (
                          <span className="shrink-0 inline-block size-1.5 rounded-full bg-blue-400" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-sidebar-muted line-clamp-2 leading-relaxed">
                        {notif.mensaje}
                      </p>
                      <p className="mt-1 text-[10px] text-sidebar-muted/60">
                        {new Date(notif.created_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'America/Argentina/Buenos_Aires',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {recientes.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/10 bg-white/5">
              <Link
                href="/notificaciones"
                className="flex items-center justify-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium"
              >
                Ver todas las notificaciones
                <ArrowRight className="size-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
