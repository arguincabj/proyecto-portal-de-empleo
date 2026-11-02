'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clock,
  Building2,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  MapPin,
  Pencil,
  X,
  LoaderCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { logout } from '@/app/auth/actions'
import { reenviarPerfilEmpresaRevision } from './actions'

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

type Props = {
  empresa: {
    id: string
    razon_social: string | null
    cuit: string | null
    rubro: string | null
    descripcion: string | null
    email: string | null
    created_at?: string
  }
  usuario: {
    nombre: string
    apellido: string
    telefono: string | null
  }
}

export function EmpresaEnEspera({ empresa, usuario }: Props) {
  const router = useRouter()
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [isPendingGuardar, startTransitionGuardar] = useTransition()

  // Estados del formulario de edición
  const [razonSocial, setRazonSocial] = useState(empresa.razon_social ?? '')
  const [cuit, setCuit] = useState(empresa.cuit ?? '')
  const [rubro, setRubro] = useState(empresa.rubro ?? '')
  const [descripcion, setDescripcion] = useState(empresa.descripcion ?? '')
  const [email, setEmail] = useState(empresa.email ?? '')
  const [nombre, setNombre] = useState(usuario.nombre ?? '')
  const [apellido, setApellido] = useState(usuario.apellido ?? '')
  const [telefono, setTelefono] = useState(usuario.telefono ?? '')
  const [errorForm, setErrorForm] = useState('')

  const handleCerrarSesion = async () => {
    await logout()
  }

  const handleGuardarCambios = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorForm('')

    if (!razonSocial.trim()) {
      setErrorForm('La razón social es obligatoria.')
      return
    }
    if (!/^\d{11}$/.test(cuit.trim())) {
      setErrorForm('El CUIT debe tener exactamente 11 números sin guiones.')
      return
    }
    if (!rubro.trim()) {
      setErrorForm('Seleccioná el rubro de la empresa.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorForm('Ingresá un email de contacto válido.')
      return
    }
    if (!nombre.trim() || !apellido.trim()) {
      setErrorForm('Ingresá nombre y apellido del responsable.')
      return
    }

    startTransitionGuardar(async () => {
      const res = await reenviarPerfilEmpresaRevision({
        razon_social: razonSocial,
        cuit,
        rubro,
        descripcion,
        email,
        nombre,
        apellido,
        telefono,
      })

      if (res.ok) {
        toast.success('Datos actualizados correctamente')
        setModalEditarAbierto(false)
        router.refresh()
      } else {
        setErrorForm(res.error ?? 'Error al guardar los cambios.')
        toast.error(res.error ?? 'Error al guardar.')
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Banner de Estado En Espera */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/40 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300 shadow-2xs">
              <Clock className="size-7 text-amber-700 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                <span>En espera de confirmación municipal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Cuenta de Empresa en Revisión
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed mt-1">
                Tu perfil de empresa fue registrado con éxito y ha sido enviado a la Dirección Municipal de Empleo de Funes.
                Para garantizar la seguridad de los postulantes, la administración verifica los datos de cada empleador antes de habilitar la publicación de ofertas laborales.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setModalEditarAbierto(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs"
            >
              <Pencil className="size-3.5" />
              <span>Editar datos enviados</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ficha de Datos Registrados */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-5 text-teal-700" />
              <h2 className="text-base font-bold text-gray-900">Datos registrados de tu empresa</h2>
            </div>
            <button
              onClick={() => setModalEditarAbierto(true)}
              className="text-xs font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
            >
              <Pencil className="size-3" />
              <span>Modificar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Razón Social</span>
              <p className="font-bold text-gray-900 text-sm truncate">{empresa.razon_social || 'No especificada'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">CUIT</span>
              <p className="font-bold text-gray-900 text-sm font-mono">{empresa.cuit || 'No especificado'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Rubro</span>
              <p className="font-bold text-gray-900 text-sm">{empresa.rubro || 'General'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Email de contacto</span>
              <p className="font-bold text-gray-900 text-sm truncate">{empresa.email || 'No especificado'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Responsable a cargo</span>
              <p className="font-bold text-gray-900 text-sm">
                {[usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || 'No especificado'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium block">Teléfono de contacto</span>
              <p className="font-bold text-gray-900 text-sm font-mono">{usuario.telefono || 'No especificado'}</p>
            </div>
          </div>

          {empresa.descripcion && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-xs text-gray-400 font-medium block">Descripción corporativa</span>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{empresa.descripcion}</p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs text-gray-500">
            <span>
              {empresa.created_at
                ? `Solicitud enviada: ${new Date(empresa.created_at).toLocaleDateString('es-AR')}`
                : 'Solicitud enviada'}
            </span>
            <button
              onClick={handleCerrarSesion}
              className="text-xs font-semibold text-gray-600 hover:text-red-700 transition-colors inline-flex items-center gap-1.5"
            >
              <LogOut className="size-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Tarjeta Lateral de Información Municipal */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
              <ShieldCheck className="size-5 text-teal-600 shrink-0" />
              <span>¿Qué sucede a continuación?</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <span>La Oficina de Empleo verifica la inscripción</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <span>Una vez validada, recibirás una notificación y tu panel quedará habilitado para publicar ofertas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <span>Si el equipo municipal requiere algún dato adicional, te indicará el motivo para que puedas actualizarlo.</span>
              </li>
            </ul>
          </div>

          <div className="bg-teal-50/70 rounded-3xl p-6 border border-teal-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-950">
              Oficina Municipal de Empleo
            </h3>
            <p className="text-xs text-teal-900 leading-relaxed">
              ¿Necesitás agilizar la validación de tu empresa o tenés consultas? Ponete en contacto con nosotros:
            </p>
            <div className="space-y-1.5 text-xs text-teal-800 pt-1">
              <p className="flex items-center gap-2">
                <MapPin className="size-3.5 text-teal-600 shrink-0" />
                <span>Pedro A. Ríos 1500, Funes</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-3.5 text-teal-600 shrink-0" />
                <span>(0341) 4936000</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-3.5 text-teal-600 shrink-0" />
                <a href="mailto:empleo@funes.gob.ar" className="underline hover:text-teal-950">
                  empleo@funes.gob.ar
                </a>
              </p>
            </div>
            <p className="text-[11px] text-teal-700/90 pt-1">
              Horario de atención: Lunes a Viernes de 7:00 a 13:00 hs.
            </p>
          </div>
        </div>
      </div>

      {/* Modal para Editar Datos mientras está en espera */}
      {modalEditarAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isPendingGuardar && setModalEditarAbierto(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Pencil className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Editar datos de la empresa</h3>
                  <p className="text-xs text-gray-500">Corregí los datos enviados para la revisión municipal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarAbierto(false)}
                disabled={isPendingGuardar}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarCambios} className="p-6 space-y-4 overflow-y-auto flex-1">
              {errorForm && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {errorForm}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Razón Social *</label>
                  <input
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">CUIT (11 dígitos) *</label>
                  <input
                    type="text"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    required
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Rubro *</label>
                  <select
                    value={rubro}
                    onChange={(e) => setRubro(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value="">Seleccioná un rubro</option>
                    {RUBROS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Email de contacto *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 border-t border-gray-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Nombre Responsable *</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Apellido Responsable *</label>
                  <input
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Teléfono *</label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Descripción / Presentación</label>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Breve descripción de la actividad de la empresa..."
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalEditarAbierto(false)}
                  disabled={isPendingGuardar}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPendingGuardar}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-xs disabled:opacity-50"
                >
                  {isPendingGuardar ? (
                    <>
                      <LoaderCircle className="size-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
