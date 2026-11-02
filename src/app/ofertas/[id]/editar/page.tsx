'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, AlertCircle, Save, DollarSign, Calendar } from 'lucide-react'
import { obtenerOfertaParaEditar, actualizarOferta } from '@/app/ofertas/actions'
import { formatearSalario } from '@/lib/utils'
import { toast } from 'sonner'

export default function EditarOfertaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [titulo, setTitulo] = useState('')
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [categorias, setCategorias] = useState<Array<{ id: string; nombre: string }>>([])
  const [modalidad, setModalidad] = useState('presencial')
  const [fechaInicioSeleccion, setFechaInicioSeleccion] = useState('')
  const [duracionDias, setDuracionDias] = useState(30)
  const [salario, setSalario] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState('pendiente')
  const [motivoRechazo, setMotivoRechazo] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function cargarOferta() {
      setLoading(true)
      const res = await obtenerOfertaParaEditar(id)
      if (!mounted) return

      if (res.ok && res.oferta) {
        const of = res.oferta
        setTitulo(of.titulo || '')
        setEmpresaNombre(of.empresa_nombre || '')
        setCategoriaId(res.categoriaId || '')
        setCategorias(res.categorias || [])

        // Extraer modalidad si estaba en la descripción
        const desc = of.descripcion || ''
        const matchModalidad = desc.match(/Modalidad:\s*(Presencial|Remoto|H[íi]brido)/i)
        if (matchModalidad) {
          const mod = matchModalidad[1].toLowerCase()
          setModalidad(mod.startsWith('h') ? 'hibrido' : mod)
        }

        // Limpiar la descripción de textos automáticos previos de modalidad y selección para no duplicar
        let descLimpia = desc
          .replace(/\n*Modalidad:\s*(Presencial|Remoto|H[íi]brido)[^\n]*/gi, '')
          .replace(/\n*📅\s*Proceso de Selección:[\s\S]*?(?=\n\n|$)/gi, '')
          .trim()

        setDescripcion(descLimpia || desc)

        // Fechas y período
        setFechaInicioSeleccion(
          of.fecha_inicio_seleccion || new Date().toISOString().split('T')[0]
        )
        setDuracionDias(Number(of.duracion_dias) || 30)

        // Salario
        setSalario(
          of.salario !== null && of.salario !== undefined
            ? String(of.salario)
            : ''
        )

        setEstado(of.estado || 'pendiente')
        setMotivoRechazo(of.motivo_rechazo || null)
      } else {
        setError(res.error || 'No se pudo cargar la oferta')
      }
      setLoading(false)
    }

    cargarOferta()
    return () => {
      mounted = false
    }
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!titulo.trim()) {
      setError('El título del puesto es obligatorio.')
      setSaving(false)
      return
    }

    if (duracionDias < 30 || duracionDias > 60) {
      setError('La duración de la selección debe ser de entre 30 y 60 días.')
      setSaving(false)
      return
    }

    if (!descripcion.trim()) {
      setError('La descripción del puesto y requisitos son obligatorios.')
      setSaving(false)
      return
    }

    const salarioNum =
      salario && !isNaN(Number(salario)) && Number(salario) > 0
        ? Number(salario)
        : null

    const res = await actualizarOferta(id, {
      titulo,
      descripcion,
      categoriaId: categoriaId || null,
      modalidad,
      fechaInicioSeleccion,
      duracionDias,
      salario: salarioNum,
    })

    if (!res.ok) {
      setError(res.error || 'Error al guardar los cambios')
      toast.error(res.error || 'Error al guardar')
      setSaving(false)
      return
    }

    toast.success(
      estado === 'borrador'
        ? 'Oferta corregida y enviada nuevamente a revisión municipal'
        : 'Oferta actualizada con éxito'
    )
    router.push('/empresa')
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-8 bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Cargando datos de la oferta...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href="/empresa"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Volver al panel de la empresa</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Editar oferta laboral</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Modificá los campos necesarios para corregir o actualizar tu búsqueda de empleo.
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                estado === 'borrador'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : estado === 'publicada'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {estado === 'borrador'
                ? 'En borrador (observada)'
                : estado === 'publicada'
                ? 'Publicada'
                : 'En revisión'}
            </span>
          </div>

          {/* Cartel con observación del administrador si fue observada/rechazada */}
          {motivoRechazo && (
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <AlertCircle className="size-4.5 text-amber-600 shrink-0" />
                <span>Observaciones del municipio (motivo del rechazo):</span>
              </div>
              <p className="text-sm font-medium bg-white/80 p-3 rounded-lg border border-amber-200/60 text-gray-900">
                "{motivoRechazo}"
              </p>
              <p className="text-xs text-amber-700">
                Corregí los datos señalados abajo y hacé clic en <strong>"Guardar y enviar a revisión"</strong> para que el municipio vuelva a evaluarla.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Empresa (SOLO LECTURA, protegido) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Empresa publicadora
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 text-sm cursor-not-allowed">
                <Building2 className="size-4 text-gray-400 shrink-0" />
                <span className="font-medium">{empresaNombre || 'Tu empresa'}</span>
                <span className="ml-auto text-xs text-gray-400 font-mono">(No modificable)</span>
              </div>
            </div>

            {/* Título del puesto */}
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

            {/* Categoría / Rubro y Modalidad en Grid */}
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

            {/* Período de Selección y Convocatoria (30 a 60 días) */}
            <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="size-4.5 text-teal-700" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Período de Selección y Convocatoria</h4>
                  <p className="text-xs text-gray-500">
                    Indicá cuándo comienza el proceso y cuánto tiempo durará la recepción de candidatos (entre 30 y 60 días).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label htmlFor="fechaInicio" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Comienzo de selección *
                  </label>
                  <input
                    id="fechaInicio"
                    type="date"
                    value={fechaInicioSeleccion}
                    onChange={(e) => setFechaInicioSeleccion(e.target.value)}
                    required
                    className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label htmlFor="duracionDias" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Duración de la búsqueda (30 a 60 días) *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="duracionDias"
                      type="number"
                      min={30}
                      max={60}
                      value={duracionDias}
                      onChange={(e) => setDuracionDias(Number(e.target.value))}
                      required
                      className="w-28 border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-bold text-teal-800 text-center"
                    />
                    <div className="flex gap-1.5">
                      {[30, 45, 60].map((dias) => (
                        <button
                          key={dias}
                          type="button"
                          onClick={() => setDuracionDias(dias)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors border cursor-pointer ${
                            duracionDias === dias
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {dias} d
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Elegí entre 30 y 60 días corridos de convocatoria laboral.
                  </p>
                </div>
              </div>
            </div>

            {/* Salario Ofrecido (Opcional) */}
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <DollarSign className="size-4" />
                  </span>
                  <div>
                    <label htmlFor="salario" className="block text-sm font-bold text-gray-900">
                      Salario ofrecido
                    </label>
                    <p className="text-xs text-gray-500">
                      Remuneración estimada mensual en pesos argentinos ($ ARS).
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
                  Opcional
                </span>
              </div>

              <div className="max-w-md pt-1">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    id="salario"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Ej: 850000 (Dejar en blanco si es a convenir)"
                    value={salario}
                    onChange={(e) => setSalario(e.target.value)}
                    className="w-full border border-gray-200 pl-8 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-gray-800 font-medium placeholder:text-gray-400"
                  />
                </div>
                {salario && Number(salario) > 0 ? (
                  <p className="text-xs text-emerald-700 font-medium mt-1.5 flex items-center gap-1.5">
                    <span>✓ Se mostrará en la oferta como:</span>
                    <strong className="font-bold text-emerald-800">{formatearSalario(Number(salario))}</strong>
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Si no se especifica, se informará a los postulantes como &quot;A convenir&quot;.
                  </p>
                )}
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

            {/* Botones de acción */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push('/empresa')}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !titulo.trim() || !descripcion.trim()}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Save className="size-4" />
                <span>
                  {saving
                    ? 'Guardando…'
                    : estado === 'borrador'
                    ? 'Guardar y enviar a revisión'
                    : 'Guardar cambios'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
