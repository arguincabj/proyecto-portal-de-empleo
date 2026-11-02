import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NotificacionesClient } from './notificaciones-client'

export const dynamic = 'force-dynamic'

export default async function NotificacionesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Permitir acceso a postulantes y a administradores (municipalidad)
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'postulante' && usuario?.rol !== 'municipalidad') {
    redirect('/inicio')
  }

  const { data: notificaciones } = await supabaseAdmin
    .from('notificaciones')
    .select('id, titulo, mensaje, tipo, leida, metadata, created_at')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const noLeidas = (notificaciones ?? []).filter((n) => !n.leida).length

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notificaciones</h1>
            {noLeidas > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white min-w-[1.25rem]">
                {noLeidas}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-foreground-secondary">
            {noLeidas > 0
              ? `Tenés ${noLeidas} notificación${noLeidas === 1 ? '' : 'es'} sin leer.`
              : 'Todas tus notificaciones al día.'}
          </p>
        </div>
        <Bell className="size-6 text-gray-400" aria-hidden />
      </div>

      <NotificacionesClient notificaciones={notificaciones ?? []} />
    </div>
  )
}
