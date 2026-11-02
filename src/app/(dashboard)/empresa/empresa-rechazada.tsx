'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  XCircle,
  AlertTriangle,
  Building2,
  Send,
  LogOut,
  MapPin,
  Phone,
  Mail,
  LoaderCircle,
  CheckCircle2,
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
    motivo_rechazo?: string | null
  }
  usuario: {
    nombre: string
    apellido: string
    telefono: string | null
  }
}

export function EmpresaRechazadaForm({ empresa, usuario }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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

  const handleSubmit = (e: React.FormEvent) => {
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

    startTransition(async () => {
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
        toast.success('¡Solicitud enviada a revisión municipal con éxito!')
        router.refresh()
      } else {
        setErrorForm(res.error ?? 'Error al reenviar la solicitud.')
        toast.error(res.error ?? 'Error al reenviar la solicitud.')
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Alerta de Perfil Observado */}
      <div className="bg-gradient-to-br from-red-500/10 via-red-50 to-rose-50/40 border border-red-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="size-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-200 shadow-2xs">
            <XCircle className="size-7" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
              <AlertTriangle className="size-3.5 text-red-600" />
              <span>Perfil Observado por la Administración Municipal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Solicitud de Empresa Observada
            </h1>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              La Dirección de Empleo de la Municipalidad de Funes revisó los datos de tu empresa y solicitó realizar correcciones antes de habilitar el panel.
            </p>

            {/* Motivo Registrado por el Administrador */}
            <div className="mt-4 p-4 rounded-2xl bg-white/95 border border-red-200/90 shadow-2xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-red-800 block">
                Motivo / Observaciones de la administración municipal:
              </span>
              <p className="text-sm font-medium text-gray-900 leading-relaxed whitespace-pre-line">
                {empresa.motivo_rechazo || 'Los datos cargados no pudieron ser validados. Por favor revisá tu información de CUIT, Razón Social y contacto.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulario de Modificación y Reenvío */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-teal-700" />
              <h2 className="text-base font-bold text-gray-900">Modificar datos y volver a enviar</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Corregí los datos señalados por la administración para solicitar una nueva confirmación.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorForm && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
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
                  placeholder="Ej: Mi Empresa S.R.L."
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">CUIT (11 números sin guiones) *</label>
                <input
                  type="text"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  required
                  placeholder="20123456789"
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Rubro comercial / industrial *</label>
                <select
                  value={rubro}
                  onChange={(e) => setRubro(e.target.value)}
                  required
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
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
                <label className="text-xs font-bold text-gray-700">Email corporativo de contacto *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="contacto@empresa.com"
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Nombre Responsable *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Apellido Responsable *</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Teléfono *</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                  placeholder="341 4930000"
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Descripción de la actividad</label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve reseña sobre la actividad comercial o productiva..."
                className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 resize-none"
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCerrarSesion}
                className="text-xs font-semibold text-gray-500 hover:text-red-700 transition-colors inline-flex items-center gap-1.5 py-2"
              >
                <LogOut className="size-3.5" />
                <span>Cerrar sesión</span>
              </button>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    <span>Enviando nueva solicitud...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span>Guardar cambios y volver a enviar a revisión</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tarjeta Lateral de Asistencia */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Proceso de Re-evaluación
            </h3>
            <ul className="text-xs text-gray-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Al guardar tus cambios, la cuenta pasa inmediatamente a estado <strong>Pendiente de revisión</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-teal-600 shrink-0 mt-0.5" />
                <span>La administración municipal recibirá una notificación prioritaria con tus datos corregidos.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Una vez validada la documentación, tendrás acceso completo para publicar tus búsquedas de empleo.</span>
              </li>
            </ul>
          </div>

          <div className="bg-teal-50/70 rounded-3xl p-6 border border-teal-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-950">
              Contacto Municipal
            </h3>
            <p className="text-xs text-teal-900 leading-relaxed">
              Si tenés dudas acerca de la observación realizada, comunicate directamente con el equipo:
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
              Atención presencial y telefónica: Lunes a Viernes de 7:00 a 13:00 hs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
