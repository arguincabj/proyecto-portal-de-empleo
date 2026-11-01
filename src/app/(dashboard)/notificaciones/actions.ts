'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function marcarNotificacionLeida(notificacionId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'No autorizado' }

    const { error } = await supabaseAdmin
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', notificacionId)
      .eq('usuario_id', user.id)

    if (error) return { ok: false, error: error.message }

    revalidatePath('/notificaciones')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return { ok: false, error: msg }
  }
}

export async function marcarTodasLeidas() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'No autorizado' }

    const { error } = await supabaseAdmin
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', user.id)
      .eq('leida', false)

    if (error) return { ok: false, error: error.message }

    revalidatePath('/notificaciones')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return { ok: false, error: msg }
  }
}
