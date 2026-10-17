import Link from 'next/link'
import { UserPlus, Briefcase, Shield } from 'lucide-react'

const tipos = [
  {
    href: '/auth/registro/postulante',
    icon: UserPlus,
    title: 'Soy postulante',
    description: 'Buscás trabajo y querés postularte a ofertas laborales en el municipio.',
    color: 'bg-primary-100 text-primary-600',
  },
  {
    href: '/auth/registro/empresa',
    icon: Briefcase,
    title: 'Soy empresa',
    description: 'Representás una empresa y querés publicar ofertas de empleo.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    href: '/auth/registro/administrador',
    icon: Shield,
    title: 'Administración',
    description: 'Sos personal de la Municipalidad de Funes con acceso administrativo.',
    color: 'bg-emerald-100 text-emerald-700',
  },
]

export default function RegistroPage() {
  return (
    <div className="relative w-full max-w-xl overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 shadow-elevated motion-safe:animate-enter-from-below motion-safe:[animation-delay:120ms]">
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 sm:size-12">
            <UserPlus className="size-5 sm:size-6" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1 pt-0.5">
            <h2 className="text-2xl leading-8 font-semibold tracking-tight text-foreground">Crear cuenta</h2>
            <p className="text-sm text-muted-foreground">Elegí tu tipo de cuenta para comenzar.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {tipos.map(({ href, icon: Icon, title, description, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                  {title}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</span>
              </div>
              <svg
                className="ml-auto size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-foreground-secondary">
          ¿Ya tenés cuenta?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm"
          >
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
