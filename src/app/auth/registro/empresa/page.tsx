'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RegistroEmpresaForm, type RegistroEmpresaValues } from '@/components/auth/registro-empresa-form'
import { registrarEmpresa } from '../../actions'

export default function RegistroEmpresaPage() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(values: RegistroEmpresaValues) {
    setError('')
    startTransition(async () => {
      const result = await registrarEmpresa(values)
      if (!result.ok) setError(result.error ?? 'Error inesperado')
      else router.push('/auth/verificar-email')
    })
  }

  return (
    <div className="relative w-full max-w-xl overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 shadow-elevated motion-safe:animate-enter-from-below motion-safe:[animation-delay:120ms]">
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 sm:size-12">
            <Briefcase className="size-5 sm:size-6" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1 pt-0.5">
            <h2 className="text-2xl leading-8 font-semibold tracking-tight text-foreground">Registrar empresa</h2>
            <p className="text-sm text-muted-foreground">Completá los datos de tu empresa para comenzar.</p>
          </div>
        </div>

        <RegistroEmpresaForm onSubmit={handleSubmit} pending={pending} error={error} />

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
