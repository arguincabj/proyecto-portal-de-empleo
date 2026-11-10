'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  Tag,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { actualizarPerfilLaboral } from './actions'
import { MultiSelectCategorias } from '@/components/perfil/multi-select-categorias'

export type PerfilLaboralValues = {
  estudios: string
  cursos: string
  experiencia: string
  idiomas: string
  habilidades: string
  horarios: string
  categorias?: string[]
}

type Props = {
  defaultValues: PerfilLaboralValues
  retorno?: string
  initialEditando?: boolean
}

export function PerfilLaboralForm({
  defaultValues,
  retorno,
  initialEditando = false,
}: Props) {
  const router = useRouter()
  const [editando, setEditando] = useState(initialEditando)
  const [isPending, startTransition] = useTransition()
  const [valores, setValores] = useState<PerfilLaboralValues>({
    ...defaultValues,
    categorias: defaultValues.categorias ?? [],
  })

  useEffect(() => {
    if (initialEditando) {
      setEditando(true)
      const el = document.getElementById('perfil-laboral')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [initialEditando])

  function handleChange(
    campo: keyof PerfilLaboralValues,
    valor: string | string[]
  ) {
    setValores((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleCancelar() {
    setValores({
      ...defaultValues,
      categorias: defaultValues.categorias ?? [],
    })
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
    fd.append('categorias', JSON.stringify(valores.categorias ?? []))

    startTransition(async () => {
      try {
        const result = await actualizarPerfilLaboral(fd)
        if (result.ok) {
          setEditando(false)
          toast.success('Perfil laboral actualizado correctamente')
          if (retorno) {
            router.push(retorno)
            router.refresh()
          } else {
            router.refresh()
          }
        } else {
          toast.error(result.error)
        }
      } catch {
        toast.error('Error inesperado al actualizar el perfil laboral')
      }
    })
  }

  const categoriasSeleccionadas = valores.categorias ?? []

  if (!editando) {
    return (
      <div className="space-y-6">
        {/* Categorías laborales en modo visualización */}
        <div className="rounded-xl border border-border/70 bg-background/50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600">
            <Tag className="size-4" aria-hidden />
            <span>Categorías laborales de interés</span>
          </div>
          <div className="mt-2.5">
            {categoriasSeleccionadas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categoriasSeleccionadas.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60"
                  >
                    <Briefcase className="size-3 text-primary-600 dark:text-primary-400" />
                    <span>{cat}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Sin categorías seleccionadas (elegí las áreas o rubros donde buscás trabajo para recibir mejores ofertas).
              </p>
            )}
          </div>
        </div>

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

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditando(true)}
            className="min-h-11 gap-2"
          >
            <Pencil className="size-4" aria-hidden />
            Editar perfil laboral
          </Button>
          {retorno && (
            <Link
              href={retorno}
              className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-2.5 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver a la oferta laboral</span>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Selector múltiple de Categorías Laborales */}
      <div>
        <label
          className="mb-1.5 flex items-center justify-between text-sm font-semibold text-foreground"
        >
          <span className="flex items-center gap-2">
            <Tag className="size-4 text-primary-600" aria-hidden />
            Categorías laborales de tu interés
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            Podés seleccionar varias
          </span>
        </label>
        <MultiSelectCategorias
          selected={categoriasSeleccionadas}
          onChange={(nuevas) => handleChange('categorias', nuevas)}
          disabled={isPending}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Elegí los rubros y áreas en las que te interesa postularte o tenés experiencia.
        </p>
      </div>

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

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center">
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
              {retorno ? 'Guardar y volver a la oferta' : 'Guardar perfil laboral'}
            </>
          )}
        </Button>
        {retorno && (
          <Link
            href={retorno}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 transition-colors self-start sm:self-auto sm:ml-auto"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver a la oferta sin guardar</span>
          </Link>
        )}
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
