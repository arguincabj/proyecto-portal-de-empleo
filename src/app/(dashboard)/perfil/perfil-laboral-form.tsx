'use client'

import { useState, useTransition } from 'react'
import {
  GraduationCap,
  Award,
  Briefcase,
  Languages,
  Sparkles,
  Clock,
  Pencil,
  Save,
  LoaderCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { actualizarPerfilLaboral } from './actions'

export type PerfilLaboralValues = {
  estudios: string
  cursos: string
  experiencia: string
  idiomas: string
  habilidades: string
  horarios: string
}

type Props = {
  defaultValues: PerfilLaboralValues
}

export function PerfilLaboralForm({ defaultValues }: Props) {
  const [editando, setEditando] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [valores, setValores] = useState<PerfilLaboralValues>(defaultValues)

  function handleChange(
    campo: keyof PerfilLaboralValues,
    valor: string
  ) {
    setValores((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleCancelar() {
    setValores(defaultValues)
    setEditando(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append('estudios', valores.estudios)
    fd.append('cursos', valores.cursos)
    fd.append('experiencia', valores.experiencia)
    fd.append('idiomas', valores.idiomas)
    fd.append('habilidades', valores.habilidades)
    fd.append('horarios', valores.horarios)

    startTransition(async () => {
      try {
        const result = await actualizarPerfilLaboral(fd)
        if (result.ok) {
          setEditando(false)
          toast.success('Perfil laboral actualizado correctamente')
        } else {
          toast.error(result.error)
        }
      } catch {
        toast.error('Error inesperado al actualizar el perfil laboral')
      }
    })
  }

  if (!editando) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ItemPerfilLaboral
            icon={GraduationCap}
            titulo="Estudios"
            valor={valores.estudios}
            placeholder="Ej: Secundario completo, Universitario en curso"
          />
          <ItemPerfilLaboral
            icon={Award}
            titulo="Cursos y Capacitaciones"
            valor={valores.cursos}
            placeholder="Ej: Curso de Excel avanzado, Gestión contable"
          />
          <ItemPerfilLaboral
            icon={Briefcase}
            titulo="Experiencia Laboral"
            valor={valores.experiencia}
            placeholder="Ej: 2 años en atención al público y ventas"
          />
          <ItemPerfilLaboral
            icon={Languages}
            titulo="Idiomas"
            valor={valores.idiomas}
            placeholder="Ej: Español nativo, Inglés intermedio"
          />
          <ItemPerfilLaboral
            icon={Sparkles}
            titulo="Habilidades"
            valor={valores.habilidades}
            placeholder="Ej: Trabajo en equipo, resolución de problemas, proactividad"
          />
          <ItemPerfilLaboral
            icon={Clock}
            titulo="Disponibilidad Horaria"
            valor={valores.horarios}
            placeholder="Ej: Jornada completa (full-time), turnos rotativos"
          />
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditando(true)}
            className="min-h-11 gap-2"
          >
            <Pencil className="size-4" aria-hidden />
            Editar perfil laboral
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="pl-estudios"
            className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <GraduationCap className="size-4 text-primary-600" aria-hidden />
            Estudios
          </label>
          <textarea
            id="pl-estudios"
            rows={3}
            value={valores.estudios}
            onChange={(e) => handleChange('estudios', e.target.value)}
            placeholder="Nivel educativo alcanzado, institución, títulos..."
            className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div>
          <label
            htmlFor="pl-cursos"
            className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Award className="size-4 text-primary-600" aria-hidden />
            Cursos y Capacitaciones
          </label>
          <textarea
            id="pl-cursos"
            rows={3}
            value={valores.cursos}
            onChange={(e) => handleChange('cursos', e.target.value)}
            placeholder="Cursos, talleres, certificaciones y capacitaciones realizadas..."
            className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div>
          <label
            htmlFor="pl-experiencia"
            className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Briefcase className="size-4 text-primary-600" aria-hidden />
            Experiencia Laboral
          </label>
          <textarea
            id="pl-experiencia"
            rows={4}
            value={valores.experiencia}
            onChange={(e) => handleChange('experiencia', e.target.value)}
            placeholder="Puestos anteriores, funciones desarrolladas, empresas y tiempo trabajado..."
            className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div>
          <label
            htmlFor="pl-habilidades"
            className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Sparkles className="size-4 text-primary-600" aria-hidden />
            Habilidades y Competencias
          </label>
          <textarea
            id="pl-habilidades"
            rows={4}
            value={valores.habilidades}
            onChange={(e) => handleChange('habilidades', e.target.value)}
            placeholder="Competencias laborales, conocimientos técnicos, herramientas que dominás..."
            className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div>
          <label
            htmlFor="pl-idiomas"
            className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Languages className="size-4 text-primary-600" aria-hidden />
            Idiomas
          </label>
          <input
            id="pl-idiomas"
            type="text"
            value={valores.idiomas}
            onChange={(e) => handleChange('idiomas', e.target.value)}
            placeholder="Ej: Español (nativo), Inglés (intermedio B2)..."
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div>
          <label
            htmlFor="pl-horarios"
            className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Clock className="size-4 text-primary-600" aria-hidden />
            Horarios y Disponibilidad
          </label>
          <input
            id="pl-horarios"
            type="text"
            value={valores.horarios}
            onChange={(e) => handleChange('horarios', e.target.value)}
            placeholder="Ej: Jornada completa, Part-time mañana, Fines de semana..."
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleCancelar}
          className="min-h-11"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="min-h-11 gap-2"
        >
          {isPending ? (
            <>
              <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />
              Guardando perfil laboral...
            </>
          ) : (
            <>
              <Save className="size-4" aria-hidden />
              Guardar perfil laboral
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

function ItemPerfilLaboral({
  icon: Icon,
  titulo,
  valor,
  placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>
  titulo: string
  valor: string
  placeholder: string
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600">
        <Icon className="size-4" aria-hidden />
        <span>{titulo}</span>
      </div>
      <p className="mt-2 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
        {valor ? (
          valor
        ) : (
          <span className="text-xs text-muted-foreground italic">
            Sin especificar ({placeholder})
          </span>
        )}
      </p>
    </div>
  )
}
