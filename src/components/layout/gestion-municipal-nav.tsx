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

function isGestionSubActive(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === '/admin'
  }
  return pathname === href || pathname.startsWith(href + '/')
}

export function GestionMunicipalNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const isAnySubActive = subItems.some((item) => isGestionSubActive(pathname, item.href))

  const [isOpen, setIsOpen] = useState(isAnySubActive)

  const toggleOpen = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <div className="space-y-1">
      {/* Botón desplegable principal */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Cerrar opciones de Gestión Municipal' : 'Abrir opciones de Gestión Municipal'}
        aria-expanded={isOpen}
        className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isAnySubActive
            ? 'bg-sidebar-hover text-sidebar-foreground font-semibold shadow-xs ring-1 ring-white/15'
            : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/70'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Shield
            className={`size-4 shrink-0 transition-transform duration-200 ${
              isAnySubActive
                ? 'text-sidebar-foreground scale-110'
                : 'text-sidebar-muted group-hover:text-sidebar-foreground'
            }`}
          />
          <span className="truncate">Gestión Municipal</span>
        </div>

        <ChevronDown
          className={`size-4 opacity-75 transition-transform duration-200 ${
            isOpen ? 'rotate-180 opacity-100' : ''
          }`}
        />
      </button>

      {/* Submenú desplegable */}
      {isOpen && (
        <div className="ml-3 pl-3 border-l-2 border-white/20 space-y-1 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {subItems.map((sub) => {
            const SubIcon = sub.icon
            const isActive = isGestionSubActive(pathname, sub.href)

            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={onNavigate}
                className={`group/sub flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sidebar-hover text-sidebar-foreground font-semibold shadow-xs ring-1 ring-white/20'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover/60'
                }`}
              >
                <SubIcon
                  className={`size-3.5 shrink-0 transition-transform duration-200 ${
                    isActive
                      ? 'text-sidebar-foreground scale-110 opacity-100'
                      : 'opacity-80 group-hover/sub:opacity-100'
                  }`}
                />
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
  return <GestionMunicipalNav onNavigate={onNavigate} />
}
