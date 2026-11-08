'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Shield,
  ChevronDown,
  BarChart3,
  Briefcase,
  Building2,
  Users,
  UserX,
} from 'lucide-react'

const subItems = [
  {
    href: '/admin/estadisticas',
    label: 'Estadísticas',
    icon: BarChart3,
  },
  {
    href: '/admin',
    label: 'Aprobación de Ofertas',
    icon: Briefcase,
  },
  {
    href: '/admin/empresas',
    label: 'Aprobación de Empresas',
    icon: Building2,
  },
  {
    href: '/admin/postulantes',
    label: 'Gestión de Postulantes',
    icon: Users,
  },
  {
    href: '/admin/rechazados',
    label: 'Postulantes Rechazados',
    icon: UserX,
  },
]

export function GestionMunicipalNav() {
  const pathname = usePathname()
  const isAnySubActive = subItems.some((item) =>
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
  )

  const [isOpen, setIsOpen] = useState(isAnySubActive)

  const toggleOpen = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <div className="space-y-1">
      {/* Botón completo clickable para desplegar/replegar */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Cerrar opciones de Gestión Municipal' : 'Abrir opciones de Gestión Municipal'}
        aria-expanded={isOpen}
        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isAnySubActive
            ? 'bg-sidebar-hover text-sidebar-foreground shadow-sm'
            : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Shield className="size-4 shrink-0" />
          <span className="truncate">Gestión Municipal</span>
        </div>

        <ChevronDown
          className={`size-4 opacity-75 transition-transform duration-200 ${
            isOpen ? 'rotate-180 opacity-100' : ''
          }`}
        />
      </button>

      {/* Submenú desplegable únicamente al hacer clic */}
      {isOpen && (
        <div className="ml-3 pl-3 border-l-2 border-white/15 space-y-1 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {subItems.map((sub) => {
            const SubIcon = sub.icon
            const isActive =
              sub.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(sub.href)

            return (
              <Link
                key={sub.href}
                href={sub.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-hover text-sidebar-foreground font-semibold shadow-xs'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/70'
                }`}
              >
                <SubIcon className="size-3.5 shrink-0 opacity-80" />
                <span className="truncate">{sub.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MobileGestionMunicipalNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const isAnySubActive = subItems.some((item) =>
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
  )
  const [isExpanded, setIsExpanded] = useState(isAnySubActive)

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev)
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={toggleExpand}
        aria-label="Expandir opciones de Gestión Municipal"
        aria-expanded={isExpanded}
        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isAnySubActive
            ? 'bg-sidebar-hover text-sidebar-foreground'
            : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Shield className="size-4 shrink-0" />
          <span className="truncate">Gestión Municipal</span>
        </div>

        <ChevronDown
          className={`size-4 opacity-75 transition-transform duration-200 ${
            isExpanded ? 'rotate-180 opacity-100' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="ml-3 pl-3 border-l-2 border-white/15 space-y-1 py-1">
          {subItems.map((sub) => {
            const SubIcon = sub.icon
            const isActive =
              sub.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(sub.href)

            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-hover text-sidebar-foreground font-semibold'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/70'
                }`}
              >
                <SubIcon className="size-3.5 shrink-0" />
                <span className="truncate">{sub.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
