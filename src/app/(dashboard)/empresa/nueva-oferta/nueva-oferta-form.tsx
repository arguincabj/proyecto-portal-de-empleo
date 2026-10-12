'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { crearOfertaEmpresa } from '../actions'

interface NuevaOfertaFormProps {
  razonSocial: string
  categorias: Array<{ id: string; nombre: string }>
}

export function NuevaOfertaForm({ razonSocial, categorias }: NuevaOfertaFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [titulo, setTitulo] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [modalidad, setModalidad] = useState('presencial')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!titulo.trim()) {
      setError('El título del puesto es obligatorio.')
      return
    }

    if (!descripcion.trim()) {
      setError('La descripción del puesto y requisitos son obligatorios.')
      return
    }

    startTransition(async () => {
      const res = await crearOfertaEmpresa({
        titulo,
        descripcion,
        categoriaId: categoriaId || undefined,
        modalidad,
        estado: 'pendiente',
      })

      if (res.ok) {
        toast.success('¡Oferta enviada con éxito! Quedó pendiente de revisión municipal.')
        router.push('/empresa')
      } else {
        setError(res.error ?? 'Ocurrió un error al crear la oferta.')
        toast.error(res.error ?? 'Error al crear la oferta')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Razón Social (Automática) */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Empresa contratante
        </label>
        <input
          type="text"
          value={razonSocial}
          disabled
          className="w-full bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-1">
          La oferta se publicará automáticamente bajo el nombre de tu empresa registrada.
        </p>
      </div>

      {/* Título de la oferta */}
      <div>
        <label htmlFor="titulo" className="block text-sm font-semibold text-gray-800 mb-1.5">
          Título del puesto laboral *
        </label>
        <input
          id="titulo"
          type="text"
          placeholder="Ej: Empleado de Mostrador y Ventas, Técnico de Mantenimiento..."
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
      </div>

      {/* Categoría y Modalidad en Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="categoria" className="block text-sm font-semibold text-gray-800 mb-1.5">
            Rubro / Categoría
          </label>
          <select
            id="categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-gray-700"
          >
            <option value="">Seleccionar categoría...</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="modalidad" className="block text-sm font-semibold text-gray-800 mb-1.5">
            Modalidad de trabajo
          </label>
          <select
            id="modalidad"
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value)}
            className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-gray-700"
          >
            <option value="presencial">Presencial</option>
            <option value="remoto">Remoto</option>
            <option value="hibrido">Híbrido</option>
          </select>
        </div>
      </div>

      {/* Descripción y Requisitos */}
      <div>
        <label htmlFor="descripcion" className="block text-sm font-semibold text-gray-800 mb-1.5">
          Descripción del puesto y requisitos *
        </label>
        <textarea
          id="descripcion"
          rows={6}
          placeholder="Detallá las tareas a realizar, requisitos indispensables, horario laboral y beneficios ofrecidos..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          className="w-full border border-gray-200 p-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white leading-relaxed resize-y"
        />
      </div>

      {/* Aviso de revisión municipal */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-800 flex items-start gap-3">
        <span className="text-base">ℹ️</span>
        <div>
          <p className="font-semibold text-blue-900 mb-0.5">Proceso de aprobación</p>
          <p>La oferta será enviada al equipo municipal para su revisión. Una vez aprobada por la administración, quedará publicada en el portal de empleo.</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Link
          href="/empresa"
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          {isPending ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              <span>Enviando oferta...</span>
            </>
          ) : (
            <span>Enviar oferta para revisión</span>
          )}
        </button>
      </div>
    </form>
  )
}
