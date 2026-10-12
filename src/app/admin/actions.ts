'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function moderarOferta(
  ofertaId: string,
  nuevoEstado: 'publicada' | 'rechazada' | 'cerrada' | 'pendiente'
) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'No autorizado. Iniciá sesión.' }
    }

    // Verificar rol municipal
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!usuario || usuario.rol !== 'municipalidad') {
      return { ok: false, error: 'Permisos insuficientes. Solo la municipalidad puede moderar ofertas.' }
    }

    const { error } = await supabaseAdmin
      .from('ofertas')
      .update({ estado: nuevoEstado })
      .eq('id', ofertaId)

    if (error) {
      return { ok: false, error: `No se pudo actualizar el estado: ${error.message}` }
    }

    revalidatePath('/admin')
    revalidatePath('/ofertas')
    revalidatePath(`/ofertas/${ofertaId}`)
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al moderar la oferta'
    return { ok: false, error: msg }
  }
}
