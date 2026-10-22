import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { EmpresaPerfilForm } from './empresa-perfil-form'
import { Building2, Clock, CheckCircle2, XCircle } from 'lucide-react'

const ESTADO_BADGE = {
  pendiente: {
    label: 'Pendiente de aprobación',
    icon: Clock,
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    iconClass: 'text-amber-500',
    banner: 'Tu perfil de empresa está siendo revisado por la Municipalidad. Mientras tanto podés usar la plataforma, pero algunas funciones podrían estar limitadas hasta la aprobación.',
    bannerClass: 'bg-amber-50 border-amber-200 text-amber-900',
  },
  aprobada: {
    label: 'Perfil aprobado',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconClass: 'text-emerald-500',
    banner: null,
    bannerClass: '',
  },
  rechazada: {
    label: 'Perfil rechazado',
    icon: XCircle,
    className: 'bg-red-50 text-red-800 border-red-200',
    iconClass: 'text-red-500',
    banner: 'Tu perfil fue rechazado por la Municipalidad. Podés editar los datos y solicitar una nueva revisión.',
    bannerClass: 'bg-red-50 border-red-200 text-red-900',
  },
}

export default async function EmpresaPerfilPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Obtener usuario
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido, telefono, rol')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'empresa') redirect('/inicio')

  // Obtener empresa (con select seguro por si la columna motivo_rechazo aún no fue migrada)
  const { data: empresa, error: errorEmpresa } = await supabase
    .from('empresas')
    .select('id, razon_social, cuit, rubro, descripcion, email, estado_aprobacion, motivo_rechazo, created_at')
    .eq('usuario_id', user.id)
    .maybeSingle()

  if (errorEmpresa && errorEmpresa.message?.includes('motivo_rechazo')) {
    const fallback = await supabase
      .from('empresas')
      .select('id, razon_social, cuit, rubro, descripcion, email, estado_aprobacion, created_at')
      .eq('usuario_id', user.id)
      .maybeSingle()
    empresa = fallback.data ? { ...fallback.data, motivo_rechazo: null } : null
  }

  if (!empresa) redirect('/empresa')

  const estado = (empresa.estado_aprobacion ?? 'pendiente') as 'pendiente' | 'aprobada' | 'rechazada'
  const badge = ESTADO_BADGE[estado] ?? ESTADO_BADGE.pendiente
  const BadgeIcon = badge.icon

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Building2 className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Perfil de Empresa</h1>
            <p className="text-xs text-gray-500">
              Miembro desde {new Date(empresa.created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Badge de estado */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${badge.className}`}
        >
          <BadgeIcon className={`size-3.5 ${badge.iconClass}`} aria-hidden />
          {badge.label}
        </span>
      </div>

      {/* Banner de estado (pendiente / rechazada) */}
      {estado === 'rechazada' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 space-y-2">
          <p className="font-semibold text-red-950 flex items-center gap-1.5">
            <XCircle className="size-4 text-red-600 shrink-0" />
            Tu perfil fue rechazado por la Dirección Municipal de Empleo
          </p>
          {empresa.motivo_rechazo ? (
            <div className="bg-white/80 rounded-lg p-3 border border-red-200 text-xs text-red-900 leading-relaxed">
              <span className="font-semibold block text-red-950 mb-1">Motivo / Instrucciones de corrección:</span>
              <p className="whitespace-pre-line">{empresa.motivo_rechazo}</p>
            </div>
          ) : (
            <p className="text-xs">
              Por favor revisá tus datos corporativos, corregilos y guardá los cambios para solicitar una nueva revisión.
            </p>
          )}
        </div>
      )}

      {estado === 'pendiente' && badge.banner && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${badge.bannerClass}`}>
          {badge.banner}
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <EmpresaPerfilForm
          defaultValues={{
            razon_social: empresa.razon_social ?? '',
            cuit: empresa.cuit ?? '',
            rubro: empresa.rubro ?? '',
            descripcion: empresa.descripcion ?? '',
            email: empresa.email ?? '',
            nombre: usuario?.nombre ?? '',
            apellido: usuario?.apellido ?? '',
            telefono: usuario?.telefono ?? '',
          }}
        />
      </div>
    </div>
  )
}
