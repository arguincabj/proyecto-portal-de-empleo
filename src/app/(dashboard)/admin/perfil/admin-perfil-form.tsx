'use client'

import { useState, useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Pencil, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { actualizarPerfilAdmin } from './actions'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string().min(1, 'El apellido es obligatorio').max(100),
  telefono: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres').max(20),
})

type AdminPerfilFormValues = z.infer<typeof schema>

type Props = {
  defaultValues: AdminPerfilFormValues
  email: string
}

export function AdminPerfilForm({ defaultValues, email }: Props) {
  const [editando, setEditando] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<AdminPerfilFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  function onSubmit(values: AdminPerfilFormValues) {
    const fd = new FormData()
    fd.append('nombre', values.nombre)
    fd.append('apellido', values.apellido)
    fd.append('telefono', values.telefono)

    startTransition(async () => {
      try {
        const result = await actualizarPerfilAdmin(fd)
        if (result.ok) {
          form.reset(values)
          setEditando(false)
          toast.success('Datos actualizados correctamente')
        } else {
          toast.error(result.error)
        }
      } catch {
        toast.error('Error inesperado al actualizar el perfil')
      }
    })
  }

  function handleEditar() {
    setEditando(true)
  }

  function handleCancelar() {
    form.reset(defaultValues)
    setEditando(false)
  }

  if (!editando) {
    return (
      <div className="space-y-4">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dato label="Nombre" valor={defaultValues.nombre} />
          <Dato label="Apellido" valor={defaultValues.apellido} />
          <Dato label="Email institucional / Acceso" valor={email} />
          <Dato label="Teléfono de contacto" valor={defaultValues.telefono} />
        </dl>

        <Button type="button" variant="outline" onClick={handleEditar} className="min-h-11 gap-2">
          <Pencil className="size-4" aria-hidden />
          Editar mis datos
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="admin-nombre">Nombre</FormLabel>
                <FormControl>
                  <Input id="admin-nombre" autoComplete="given-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="apellido"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="admin-apellido">Apellido</FormLabel>
                <FormControl>
                  <Input id="admin-apellido" autoComplete="family-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="admin-telefono">Teléfono de contacto</FormLabel>
                <FormControl>
                  <Input id="admin-telefono" type="tel" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Email institucional
            </label>
            <input
              type="text"
              disabled
              value={email}
              className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">El email corresponde a la cuenta de acceso.</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleCancelar}
            className="min-h-11"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} className="min-h-11 gap-2">
            {isPending ? (
              <>
                <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />
                Guardando...
              </>
            ) : (
              <>
                <Save className="size-4" aria-hidden />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-foreground-secondary">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{valor || '—'}</dd>
    </div>
  )
}
