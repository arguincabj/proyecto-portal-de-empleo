'use client'

import { useState } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const R = () => <span className="ml-0.5 text-danger" aria-hidden>*</span>

const schema = z.object({
  nombre:          z.string().min(2, 'Ingresá tu nombre'),
  apellido:        z.string().min(2, 'Ingresá tu apellido'),
  email:           z.string().email('Email inválido'),
  confirmar_email: z.string().email('Email inválido'),
  telefono:        z.string().regex(/^[\d\s\+\-\(\)]{8,20}$/, 'Teléfono inválido'),
  password:        z.string().min(8, 'Mínimo 8 caracteres'),
  confirmar:       z.string(),
}).refine(d => d.email === d.confirmar_email, {
  message: 'Los emails no coinciden',
  path: ['confirmar_email'],
}).refine(d => d.password === d.confirmar, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar'],
})

export type RegistroAdminValues = z.infer<typeof schema>

export function RegistroAdminForm({
  onSubmit,
  pending = false,
  error = '',
}: {
  onSubmit?: (values: RegistroAdminValues) => void
  pending?: boolean
  error?: string
}) {
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<RegistroAdminValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', apellido: '', email: '', confirmar_email: '', telefono: '', password: '', confirmar: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(values => onSubmit?.(values))} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="nombre" render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre<R /></FormLabel>
              <FormControl><Input autoComplete="given-name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="apellido" render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido<R /></FormLabel>
              <FormControl><Input autoComplete="family-name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="telefono" render={({ field }) => (
          <FormItem>
            <FormLabel>Teléfono oficial / interno<R /></FormLabel>
            <FormControl><Input type="tel" autoComplete="tel" placeholder="341 000 0000" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email institucional / laboral<R /></FormLabel>
              <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="confirmar_email" render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar email<R /></FormLabel>
              <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña<R /></FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...field} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="confirmar" render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contraseña<R /></FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...field} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger font-medium">
            {error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full mt-2">
          {pending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              <span>Registrando administrador...</span>
            </>
          ) : (
            <>
              <Shield className="size-4" aria-hidden />
              <span>Crear cuenta de Administrador</span>
            </>
          )}
        </Button>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </form>
    </Form>
  )
}
