'use client'

import { useState, useTransition } from 'react'
import {
  ShieldAlert,
  UserPlus,
  Trash2,
  Users,
  Mail,
  Phone,
  Calendar,
  X,
  LoaderCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  UserCheck,
  UserCog,
  ShieldCheck,
  IdCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminItem, crearAdministrador, eliminarAdministrador } from './actions'

type Props = {
  administradoresIniciales: AdminItem[]
}

export function SuperadminDashboardClient({ administradoresIniciales }: Props) {
  const [admins, setAdmins] = useState<AdminItem[]>(administradoresIniciales)
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false)
  const [adminAEliminar, setAdminAEliminar] = useState<AdminItem | null>(null)
  const [adminFicha, setAdminFicha] = useState<AdminItem | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const limpiarForm = () => {
    setNombre('')
    setApellido('')
    setEmail('')
    setTelefono('')
    setPassword('')
    setShowPassword(false)
    setErrorForm('')
  }

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorForm('')

    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password) {
      setErrorForm('Por favor completá todos los campos requeridos.')
      return
    }

    if (password.length < 8) {
      setErrorForm('La contraseña debe tener un mínimo de 8 caracteres.')
      return
    }

    startTransition(async () => {
      const res = await crearAdministrador({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim().toLowerCase(),
        password,
        telefono: telefono.trim(),
      })

      if (res.ok) {
        toast.success('Administrador creado con éxito')
        setModalCrearAbierto(false)
        limpiarForm()
        // Actualizar visualmente la lista
        setAdmins((prev) => [
          {
            id: `temp-${Date.now()}`,
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            email: email.trim().toLowerCase(),
            telefono: telefono.trim(),
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
      } else {
        setErrorForm(res.error ?? 'Ocurrió un error al crear el administrador.')
        toast.error(res.error ?? 'Error al crear administrador')
      }
    })
  }

  const handleEliminar = () => {
    if (!adminAEliminar) return

    startTransition(async () => {
      const idTarget = adminAEliminar.id
      const res = await eliminarAdministrador(idTarget)
      if (res.ok) {
        toast.success(`Administrador ${adminAEliminar.nombre} ${adminAEliminar.apellido} eliminado.`)
        setAdmins((prev) => prev.filter((a) => a.id !== idTarget))
        setAdminAEliminar(null)
      } else {
        toast.error(res.error ?? 'Error al eliminar administrador')
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs tracking-wider uppercase mb-1">
            <ShieldAlert className="size-4" />
            <span>Panel Exclusivo de Super Administrador</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Gestión de Administradores
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualizá, creá o eliminá cuentas con rol de administración municipal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            limpiarForm()
            setModalCrearAbierto(true)
          }}
          className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="size-4" />
          <span>Nuevo Administrador</span>
        </button>
      </div>

      {/* Tarjeta de métrica resumida */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-xs select-none flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Administradores Activos
            </p>
            <p className="text-3xl font-black text-emerald-950 mt-1">{admins.length}</p>
            <p className="text-xs text-emerald-700 mt-0.5">Personal municipal con acceso al sistema</p>
          </div>
          <div className="size-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Users className="size-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs select-none flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Seguridad & Privilegios
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-1">Control de accesos restringido</p>
            <p className="text-xs text-gray-500 mt-0.5">Solo Super Admin puede dar de alta o baja</p>
          </div>
          <div className="size-12 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center">
            <UserCheck className="size-6" />
          </div>
        </div>
      </div>

      {/* Lista de Administradores */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Perfiles de Administradores</h2>
            <p className="text-xs text-gray-500">Listado de usuarios habilitados para moderar el portal.</p>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {admins.length} {admins.length === 1 ? 'cuenta' : 'cuentas'}
          </span>
        </div>

        {admins.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="size-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No hay administradores registrados aún</p>
            <p className="text-xs text-gray-400 mt-1">
              Hacé clic en &quot;Nuevo Administrador&quot; para crear la primera cuenta.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {admins.map((admin) => (
              <div
                key={admin.id}
                onClick={() => setAdminFicha(admin)}
                className="p-6 transition-colors hover:bg-emerald-50/40 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base text-gray-900 group-hover:text-emerald-800 transition-colors">
                      {admin.nombre} {admin.apellido}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      Municipalidad
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-gray-400" />
                      <span className="text-teal-800 font-mono">
                        {admin.email}
                      </span>
                    </span>

                    {admin.telefono && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-gray-400" />
                        <span className="font-mono">
                          {admin.telefono}
                        </span>
                      </span>
                    )}

                    <span className="flex items-center gap-1.5 text-gray-400 font-mono">
                      <Calendar className="size-3.5 text-gray-400" />
                      Registrado: {new Date(admin.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setAdminFicha(admin)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                    title="Ver ficha de datos del administrador"
                  >
                    <UserCog className="size-3.5" />
                    <span>Ver Ficha</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setAdminAEliminar(admin)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                    title="Eliminar administrador"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Crear Administrador */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <UserPlus className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Crear Nuevo Administrador</h3>
                  <p className="text-xs text-gray-500">Tendrá acceso al panel municipal de gestión.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCrearAbierto(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCrear} className="p-6 overflow-y-auto space-y-4">
              {errorForm && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-red-600" />
                  <span>{errorForm}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="Ej. Pérez"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@funes.gob.ar"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 341 555 1234"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contraseña de Acceso <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3 py-2 pr-10 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">El usuario podrá iniciar sesión inmediatamente.</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setModalCrearAbierto(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isPending && <LoaderCircle className="size-3.5 animate-spin" />}
                  <span>Guardar Administrador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {adminAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-200 p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="size-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="size-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-gray-900">¿Eliminar administrador?</h3>
              <p className="text-xs text-gray-600">
                Estás por eliminar la cuenta de{' '}
                <strong className="text-gray-900">
                  {adminAEliminar.nombre} {adminAEliminar.apellido}
                </strong>{' '}
                ({adminAEliminar.email}). Ya no podrá acceder al sistema municipal.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setAdminAEliminar(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleEliminar}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending && <LoaderCircle className="size-3.5 animate-spin" />}
                <span>Eliminar Cuenta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ficha de Datos del Administrador */}
      {adminFicha && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setAdminFicha(null)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50">
              <div className="flex items-center gap-3.5 min-w-0">
                {adminFicha.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={adminFicha.avatar_url}
                    alt={`Foto de ${adminFicha.nombre}`}
                    className="size-13 rounded-2xl object-cover ring-2 ring-emerald-600/20 shrink-0"
                  />
                ) : (
                  <div className="size-13 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                    {adminFicha.nombre[0]?.toUpperCase()}
                    {adminFicha.apellido[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-gray-900 text-lg truncate">
                      {adminFicha.nombre} {adminFicha.apellido}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      Municipalidad
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Cuenta Activa
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAdminFicha(null)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Cerrar ficha"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Contenido de la Ficha */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Bloque: Información Personal y de Contacto */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Información de Contacto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                      <Mail className="size-3.5 text-gray-400" />
                      Correo Electrónico
                    </span>
                    <p className="font-semibold text-gray-900 text-sm font-mono break-all">
                      {adminFicha.email}
                    </p>
                  </div>

                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                      <Phone className="size-3.5 text-gray-400" />
                      Teléfono de Contacto
                    </span>
                    <p className="font-semibold text-gray-900 text-sm font-mono">
                      {adminFicha.telefono || 'No especificado'}
                    </p>
                  </div>

                  {adminFicha.dni && (
                    <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                        <IdCard className="size-3.5 text-gray-400" />
                        DNI
                      </span>
                      <p className="font-semibold text-gray-900 text-sm font-mono">
                        {adminFicha.dni}
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-gray-400" />
                      Fecha de Alta en el Portal
                    </span>
                    <p className="font-semibold text-gray-900 text-sm">
                      {new Date(adminFicha.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloque: Permisos y Alcance Institucional */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Nivel de Acceso y Funciones Habilitadas
                </h4>
                <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase tracking-wide">
                    <ShieldCheck className="size-4 text-teal-700" />
                    <span>Gestión Municipal Integral</span>
                  </div>
                  <ul className="text-xs text-teal-950/80 space-y-1.5 pl-5 list-disc">
                    <li>Revisión, moderación y aprobación de ofertas laborales publicadas por empresas.</li>
                    <li>Validación de nuevas empresas registradas y verificación de CUIT.</li>
                    <li>Gestión de postulaciones, derivación a empresas y seguimiento de candidatos.</li>
                    <li>Buscador de perfiles laborales y consulta de estadísticas del portal.</li>
                  </ul>
                </div>
              </div>

              {/* Bloque: Seguridad y Cuenta */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/70 text-xs text-gray-600 flex items-start gap-2.5">
                <ShieldAlert className="size-4 text-gray-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-gray-800">Cuenta de Seguridad Protegida</p>
                  <p className="text-[11px] text-gray-500">
                    Solo los Super Administradores pueden revocar el acceso o dar de baja a este personal.
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones al pie */}
            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const target = adminFicha
                  setAdminFicha(null)
                  setAdminAEliminar(target)
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 hover:border-red-200 border border-transparent transition-colors cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Eliminar Administrador</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminFicha(null)}
                className="px-5 py-2 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
