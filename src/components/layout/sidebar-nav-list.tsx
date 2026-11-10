'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Shield,
  Building2,
  Settings,
  PlusCircle,
  Briefcase,
  UserSearch,
  UserRound,
  LayoutDashboard,
  Send,
} from 'lucide-react'
import { GestionMunicipalNav } from './gestion-municipal-nav'

export type NavItemConfig = {
  href: string
  label: string
  iconName:
    | 'shield'
    | 'building'
    | 'settings'
    | 'plus'
    | 'briefcase'
    | 'userSearch'
    | 'userRound'
    | 'dashboard'
    | 'send'
  badge?: number
}

const ICON_MAP: Record<NavItemConfig['iconName'], React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  building: Building2,
  settings: Settings,
  plus: PlusCircle,
  briefcase: Briefcase,
  userSearch: UserSearch,
  userRound: UserRound,
  dashboard: LayoutDashboard,
  send: Send,
}

export function getNavItemsByRole(rol?: string): NavItemConfig[] {
  if (rol === 'superadmin') {
    return [
      { href: '/superadmin', label: 'Gestión de Administradores', iconName: 'shield' },
      { href: '/admin', label: 'Gestión Municipal', iconName: 'shield' },
      { href: '/admin/buscador', label: 'Buscador de Postulantes', iconName: 'userSearch' },
      { href: '/admin/perfil', label: 'Mis Datos', iconName: 'userRound' },
      { href: '/ofertas', label: 'Ofertas Laborales', iconName: 'briefcase' },
    ]
  }

  if (rol === 'empresa') {
    return [
      { href: '/empresa', label: 'Panel de Empresa', iconName: 'building' },
      { href: '/empresa/perfil', label: 'Perfil de Empresa', iconName: 'settings' },
      { href: '/empresa/nueva-oferta', label: 'Publicar Oferta', iconName: 'plus' },
      { href: '/ofertas', label: 'Portal de Ofertas', iconName: 'briefcase' },
    ]
  }

  if (rol === 'municipalidad') {
    return [
      { href: '/admin', label: 'Gestión Municipal', iconName: 'shield' },
      { href: '/admin/buscador', label: 'Buscador de Postulantes', iconName: 'userSearch' },
      { href: '/admin/perfil', label: 'Mis Datos', iconName: 'userRound' },
      { href: '/ofertas', label: 'Ofertas Laborales', iconName: 'briefcase' },
    ]
  }

  return [
    { href: '/inicio', label: 'Inicio', iconName: 'dashboard' },
    { href: '/perfil', label: 'Mi Perfil', iconName: 'userRound' },
    { href: '/ofertas', label: 'Ofertas', iconName: 'briefcase' },
    { href: '/postulaciones', label: 'Mis Postulaciones', iconName: 'send' },
  ]
}

type Props = {
  rol?: string
  onNavigate?: () => void
}

/**
 * Determina si un enlace de navegación debe considerarse activo según el pathname actual.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true

  // Para el portal de ofertas, cualquier ruta interna de ofertas pertenece a esta sección
  if (href === '/ofertas' && pathname.startsWith('/ofertas/')) {
    return true
  }

  // Para el perfil de empresa, rutas anidadas
  if (href === '/empresa/perfil' && pathname.startsWith('/empresa/perfil/')) {
    return true
  }

  // Para nueva oferta de empresa
  if (href === '/empresa/nueva-oferta' && pathname.startsWith('/empresa/nueva-oferta/')) {
    return true
  }

  // Para panel de empresa (/empresa): activa solo para /empresa o páginas directas de sus ofertas (ej. /empresa/ofertas/...)
  if (href === '/empresa') {
    if (pathname === '/empresa') return true
    if (pathname.startsWith('/empresa/ofertas/')) return true
    return false
  }

  // Para postulaciones
  if (href === '/postulaciones' && pathname.startsWith('/postulaciones/')) {
    return true
  }

  // Para perfil de postulante
  if (href === '/perfil' && pathname.startsWith('/perfil/')) {
    return true
  }

  // Para buscador de postulantes de admin
  if (href === '/admin/buscador' && pathname.startsWith('/admin/buscador/')) {
    return true
  }

  // Para mis datos de admin
  if (href === '/admin/perfil' && pathname.startsWith('/admin/perfil/')) {
    return true
  }

  // Para superadmin
  if (href === '/superadmin' && pathname.startsWith('/superadmin/')) {
    return true
  }

  // Para inicio
  if (href === '/inicio' && pathname.startsWith('/inicio/')) {
    return true
  }

  return false
}

export function SidebarNavList({ rol, onNavigate }: Props) {
  const pathname = usePathname()
  const navItems = getNavItemsByRole(rol)

  if (rol === 'municipalidad' || rol === 'superadmin') {
    return (
      <>
        {rol === 'superadmin' && (
          <Link
            href="/superadmin"
            onClick={onNavigate}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith('/superadmin')
                ? 'bg-sidebar-hover text-sidebar-foreground font-semibold shadow-xs ring-1 ring-white/15'
                : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/70'
            }`}
          >
            <Shield
              className={`size-4 shrink-0 transition-transform duration-200 ${
                pathname.startsWith('/superadmin')
                  ? 'text-sidebar-foreground scale-110'
                  : 'text-sidebar-muted group-hover:text-sidebar-foreground'
              }`}
            />
            <span className="flex-1 truncate">Gestión de Administradores</span>
          </Link>
        )}
        <GestionMunicipalNav onNavigate={onNavigate} />
        {navItems
          .filter((item) => item.href !== '/admin' && item.href !== '/superadmin')
          .map((item) => {
            const Icon = ICON_MAP[item.iconName]
            const active = isNavItemActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-sidebar-hover text-sidebar-foreground font-semibold shadow-xs ring-1 ring-white/15'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/70'
                }`}
              >
                <Icon
                  className={`size-4 shrink-0 transition-transform duration-200 ${
                    active ? 'text-sidebar-foreground scale-110' : 'text-sidebar-muted group-hover:text-sidebar-foreground'
                  }`}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="ml-auto inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
      </>
    )
  }

  return (
    <>
      {navItems.map((item) => {
        const Icon = ICON_MAP[item.iconName]
        const active = isNavItemActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? 'bg-sidebar-hover text-sidebar-foreground font-semibold shadow-xs ring-1 ring-white/15'
                : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/70'
            }`}
          >
            <Icon
              className={`size-4 shrink-0 transition-transform duration-200 ${
                active ? 'text-sidebar-foreground scale-110' : 'text-sidebar-muted group-hover:text-sidebar-foreground'
              }`}
            />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="ml-auto inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </>
  )
}
