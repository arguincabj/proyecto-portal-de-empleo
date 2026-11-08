import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, UserRound } from 'lucide-react'
import escudo from '@/assets/brand/escudo-funes-blanco.png'
import { logout } from '@/app/auth/actions'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NotificacionesPopover } from './notificaciones-popover'
import { SidebarNavList } from './sidebar-nav-list'

const ROL_LABEL: Record<string, string> = {
  postulante: 'Postulante',
  empresa: 'Empresa',
  municipalidad: 'Municipalidad',
  superadmin: 'Super Administrador',
}

type Props = {
  usuario: { nombre: string; apellido: string; rol: string; avatar_url?: string | null } | null
}

export async function Sidebar({ usuario }: Props) {
  // Contar notificaciones no leídas y obtener las recientes para postulantes y administradores
  let noLeidas = 0
  let notificacionesRecientes: { id: string; titulo: string; mensaje: string; tipo: string; leida: boolean; created_at: string }[] = []

  const tieneNotificaciones = usuario?.rol === 'postulante' || usuario?.rol === 'municipalidad' || usuario?.rol === 'superadmin'

  if (tieneNotificaciones) {
    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { count } = await supabaseAdmin
          .from('notificaciones')
          .select('id', { count: 'exact', head: true })
          .eq('usuario_id', user.id)
          .eq('leida', false)
        noLeidas = count ?? 0

        const { data } = await supabaseAdmin
          .from('notificaciones')
          .select('id, titulo, mensaje, tipo, leida, created_at')
          .eq('usuario_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
        notificacionesRecientes = data ?? []
      }
    } catch { /* silencioso */ }
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar lg:flex h-dvh sticky top-0">
      <div className="flex shrink-0 items-center gap-3 px-5 py-6">
        <Image src={escudo} alt="" width={32} height={32} className="shrink-0" />
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
            Portal de Empleo
          </span>
          <span className="truncate text-sm font-bold leading-tight text-sidebar-foreground">
            Municipalidad de Funes
          </span>
        </div>
      </div>

      <div className="mx-5 h-px bg-white/10 shrink-0" />

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
        <SidebarNavList rol={usuario?.rol} />
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4 bg-sidebar">
        {/* Notificaciones con popover — solo para roles que las tienen */}
        {tieneNotificaciones && (
          <div className="mb-2 px-1">
            <NotificacionesPopover
              noLeidas={noLeidas}
              notificaciones={notificacionesRecientes}
            />
          </div>
        )}

        {usuario && (
          <Link
            href={
              usuario.rol === 'postulante'
                ? '/perfil'
                : usuario.rol === 'empresa'
                ? '/empresa/perfil'
                : '/admin/perfil'
            }
            title="Ver mis datos"
            className="mb-3 block min-h-11 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-hover"
          >
            <UsuarioInfo usuario={usuario} />
          </Link>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <LogOut className="size-4" aria-hidden />
            </span>
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}

function UsuarioInfo({ usuario }: { usuario: NonNullable<Props['usuario']> }) {
  return (
    <div className="flex items-center gap-3">
      {usuario.avatar_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={usuario.avatar_url}
          alt={`Foto de ${usuario.nombre}`}
          className="size-9 shrink-0 rounded-full object-cover ring-1 ring-white/30"
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sidebar-foreground ring-1 ring-white/20">
          <UserRound className="size-5" aria-hidden />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-sidebar-foreground">
          {usuario.nombre} {usuario.apellido}
        </p>
        <p className="mt-0.5 text-xs text-sidebar-muted">
          {ROL_LABEL[usuario.rol] ?? usuario.rol}
        </p>
      </div>
    </div>
  )
}
