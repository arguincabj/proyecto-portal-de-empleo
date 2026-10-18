'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RegistroPostulanteForm, type RegistroPostulanteValues } from '@/components/auth/registro-postulante-form'
import { registrarPostulante } from '../../actions'

export default function RegistroPostulantePage() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(values: RegistroPostulanteValues) {
    setError('')
    startTransition(async () => {
      const result = await registrarPostulante(values)
      if (!result.ok) {
        setError(result.error ?? 'Error inesperado')
      } else if (result.hasSession) {
        router.push('/inicio')
      } else {
        router.push('/auth/verificar-email')
      }
    })
  }

  return (
    <div className="relative w-full max-w-xl overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 shadow-elevated motion-safe:animate-enter-from-below motion-safe:[animation-delay:120ms]">
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 sm:size-12">
            <UserPlus className="size-5 sm:size-6" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1 pt-0.5">
            <h2 className="text-2xl leading-8 font-semibold tracking-tight text-foreground">Registrarme como postulante</h2>
            <p className="text-sm text-muted-foreground">Completá tus datos para crear tu cuenta.</p>
          </div>
        </div>

        <RegistroPostulanteForm onSubmit={handleSubmit} pending={pending} error={error} />

        <div className="mt-4 text-center">
          <Link
            href="/auth/registro"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Volver a elegir tipo de cuenta
          </Link>
        </div>
      </div>
    </div>
  )
}
