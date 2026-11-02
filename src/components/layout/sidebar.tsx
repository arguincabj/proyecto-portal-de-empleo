import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, UserRound, Building2, PlusCircle, Briefcase, LayoutDashboard, Shield, Send, Settings, Bell, UserSearch, GraduationCap } from 'lucide-react'
import escudo from '@/assets/brand/escudo-funes-blanco.png'
import { logout } from '@/app/auth/actions'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ROL_LABEL: Record<string, string> = {
  postulante: 'Postulante',
  empresa: 'Empresa',
  municipalidad: 'Municipalidad',
}

type Props = {
  usuario: { nombre: string; apellido: string; rol: string; avatar_url?: string | null } | null
}

export async function Sidebar({ usuario }: Props) {
  // Contar notificaciones no leídas para postulantes
  let noLeidas = 0
  if (usuario?.rol === 'postulante') {
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
      }
    } catch { /* silencioso */ }
  }

  const navItems: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] =
    usuario?.rol === 'empresa'
      ? [
          { href: '/empresa', label: 'Panel de Empresa', icon: Building2 },
          { href: '/empresa/perfil', label: 'Perfil de Empresa', icon: Settings },
          { href: '/empresa/nueva-oferta', label: 'Publicar Oferta', icon: PlusCircle },
          { href: '/ofertas', label: 'Portal de Ofertas', icon: Briefcase },
        ]
      : usuario?.rol === 'municipalidad'
      ? [
          { href: '/admin', label: 'Gestión Municipal', icon: Shield },
          { href: '/admin/buscador', label: 'Buscador de Perfiles', icon: UserSearch },
          { href: '/admin/perfil', label: 'Mis Datos', icon: UserRound },
          { href: '/ofertas', label: 'Ofertas Laborales', icon: Briefcase },
        ]
      : [
          { href: '/inicio', label: 'Inicio', icon: LayoutDashboard },
          { href: '/perfil', label: 'Mi Perfil', icon: UserRound },
          { href: '/ofertas', label: 'Ofertas', icon: Briefcase },
          { href: '/postulaciones', label: 'Mis Postulaciones', icon: Send },
          { href: '/cursos-y-videos', label: 'Cursos y Videos', icon: GraduationCap },
          { href: '/notificaciones', label: 'Notificaciones', icon: Bell, badge: noLeidas },
        ]

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar lg:flex">
      <div className="flex items-center gap-3 px-5 py-6">
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

      <div className="mx-5 h-px bg-white/10" />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover transition-colors"
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
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
