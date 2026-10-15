'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

type ActionResult = { ok: true } | { ok: false; error: string }

export async function actualizarPerfilAdmin(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { ok: false, error: 'No autenticado' }

    const { data: usuarioRol } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (usuarioRol?.rol !== 'municipalidad') {
      return { ok: false, error: 'Acción no permitida para tu rol' }
    }

    const nombre = (formData.get('nombre') as string | null)?.trim() ?? ''
    const apellido = (formData.get('apellido') as string | null)?.trim() ?? ''
    const telefono = (formData.get('telefono') as string | null)?.trim() ?? ''

    if (!nombre || !apellido || !telefono) {
      return { ok: false, error: 'Todos los campos son obligatorios' }
    }

    const { error: errorUsuario } = await supabaseAdmin
      .from('usuarios')
      .update({ nombre, apellido, telefono })
      .eq('id', user.id)

    if (errorUsuario) {
      return { ok: false, error: 'No se pudieron actualizar los datos del usuario' }
    }

    revalidatePath('/admin/perfil')
    revalidatePath('/admin')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al actualizar el perfil'
    return { ok: false, error: msg }
  }
}
