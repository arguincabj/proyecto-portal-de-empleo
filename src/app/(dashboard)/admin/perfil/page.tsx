import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { AdminPerfilForm } from './admin-perfil-form'
import { FotoPerfilUpload } from '@/components/perfil/foto-perfil-upload'
import { ShieldCheck, UserCog } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPerfilPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido, telefono, rol, created_at')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'municipalidad') {
    redirect('/inicio')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <UserCog className="size-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mis Datos de Administrador</h1>
            <p className="text-xs text-gray-500">
              Datos personales y de contacto asignados a tu cuenta de gestión municipal.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
          <ShieldCheck className="size-3.5 text-teal-600" />
          <span>Personal Municipal</span>
        </div>
      </div>

      {/* Foto de Perfil Institucional */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Foto de perfil institucional</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Imagen de perfil que se muestra en el panel de control municipal y en tus datos de cuenta.
          </p>
        </div>
        <FotoPerfilUpload
          currentAvatarUrl={user.user_metadata?.avatar_url || (usuario as any)?.avatar_url || null}
          nombre={usuario?.nombre ?? 'Admin'}
          apellido={usuario?.apellido ?? ''}
          rol="municipalidad"
        />
      </section>

      {/* Tarjeta de formulario */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-bold text-gray-900">Datos personales</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Podés revisar y actualizar tus datos de contacto aquí.
          </p>
        </div>

        <AdminPerfilForm
          email={user.email ?? ''}
          defaultValues={{
            nombre: usuario?.nombre ?? '',
            apellido: usuario?.apellido ?? '',
            telefono: usuario?.telefono ?? '',
          }}
        />
      </section>
    </div>
  )
}
