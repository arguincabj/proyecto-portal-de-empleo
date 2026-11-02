import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { esSuperAdmin } from '@/lib/superadmin'
import { obtenerAdministradores } from './actions'
import { SuperadminDashboardClient } from './superadmin-dashboard-client'

export const dynamic = 'force-dynamic'

export default async function SuperadminPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (!esSuperAdmin(user)) {
    redirect('/admin')
  }

  const { administradores = [] } = await obtenerAdministradores()

  return <SuperadminDashboardClient administradoresIniciales={administradores} />
}
