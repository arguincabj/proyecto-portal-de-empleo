'use client'

import { useState, useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Pencil, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { actualizarPerfilEmpresa } from './actions'

const RUBROS = [
  'Agro e industria alimentaria',
  'Arte y entretenimiento',
  'Comercio minorista y mayorista',
  'Construcción e inmobiliaria',
  'Educación y formación',
  'Finanzas y seguros',
  'Gastronomía y hotelería',
  'Logística y transporte',
  'Manufactura e industria',
  'Salud y bienestar',
  'Servicios profesionales',
  'Tecnología e informática',
  'Otro',
] as const

const schema = z.object({
  razon_social: z.string().min(2, 'Ingresá la razón social'),
  cuit: z.string().regex(/^\d{11}$/, 'CUIT inválido (11 dígitos sin guiones)'),
  rubro: z.string().min(1, 'Seleccioná un rubro'),
  descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'Ingresá el nombre'),
  apellido: z.string().min(2, 'Ingresá el apellido'),
  telefono: z.string().regex(/^[\d\s\+\-\(\)]{8,20}$/, 'Teléfono inválido'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  defaultValues: FormValues
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{valor || '—'}</dd>
    </div>
  )
}

export function EmpresaPerfilForm({ defaultValues }: Props) {
  const [editando, setEditando] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  function onSubmit(values: FormValues) {
    const fd = new FormData()
    fd.append('razon_social', values.razon_social)
    fd.append('cuit', values.cuit)
    fd.append('rubro', values.rubro)
    fd.append('descripcion', values.descripcion ?? '')
    fd.append('email', values.email)
    fd.append('nombre', values.nombre)
    fd.append('apellido', values.apellido)
    fd.append('telefono', values.telefono)

    startTransition(async () => {
      try {
        const result = await actualizarPerfilEmpresa(fd)
        if (result.ok) {
          form.reset(values)
          setEditando(false)
          if (result.vueltoPendiente) {
            toast.warning(
              'Datos guardados. Tu perfil volvió a estado pendiente porque modificaste el CUIT o la Razón Social. La Municipalidad deberá re-aprobarlo.'
            )
          } else {
            toast.success('Datos actualizados correctamente')
          }
        } else {
          toast.error(result.error ?? 'Error al guardar')
        }
      } catch {
        toast.error('Error inesperado al actualizar el perfil')
      }
    })
  }

  function handleCancelar() {
    form.reset(defaultValues)
    setEditando(false)
  }

  if (!editando) {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Datos de la empresa
          </h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Dato label="Razón Social" valor={defaultValues.razon_social} />
            <Dato label="CUIT" valor={defaultValues.cuit} />
            <Dato label="Rubro" valor={defaultValues.rubro} />
            <Dato label="Email de contacto" valor={defaultValues.email} />
          </dl>
          {defaultValues.descripcion && (
            <div className="mt-4">
              <dt className="text-xs font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {defaultValues.descripcion}
              </dd>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Datos del responsable
          </h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Dato label="Nombre" valor={defaultValues.nombre} />
            <Dato label="Apellido" valor={defaultValues.apellido} />
            <Dato label="Teléfono" valor={defaultValues.telefono} />
          </dl>
        </div>

        <Button type="button" variant="outline" onClick={() => setEditando(true)} className="min-h-11 gap-2">
          <Pencil className="size-4" aria-hidden />
          Editar perfil
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Datos sensibles */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Datos de la empresa
            <span className="ml-2 font-normal text-amber-600 normal-case">
              ⚠ Cambiar CUIT o Razón Social requiere nueva aprobación
            </span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="razon_social"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón Social</FormLabel>
                  <FormControl>
                    <Input autoComplete="organization" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CUIT</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="20123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="rubro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rubro</FormLabel>
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v)}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccioná un rubro" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RUBROS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email de contacto</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción de la empresa</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  rows={3}
                  placeholder="Describí brevemente tu empresa, actividad, etc."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Datos del responsable */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Datos del responsable
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input autoComplete="given-name" {...field} />
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
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mt-4">
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input type="tel" autoComplete="tel" placeholder="11 2345 6789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
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
