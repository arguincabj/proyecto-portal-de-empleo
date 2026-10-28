'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function postularAOferta(ofertaId: string, cvId?: string | null) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { ok: false, error: 'Debes iniciar sesión para postularte.' }
    }

    // 1. Verificar rol de usuario
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (usuarioError || !usuario) {
      return { ok: false, error: 'No se encontró información de tu usuario.' }
    }

    if (usuario.rol !== 'postulante') {
      return {
        ok: false,
        error: 'Solo los usuarios registrados como postulantes pueden postularse a ofertas laborales.',
      }
    }

    // 2. Obtener ID de postulante
    const { data: postulante, error: postulanteError } = await supabase
      .from('postulantes')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (postulanteError || !postulante) {
      return { ok: false, error: 'No se encontró tu perfil de postulante.' }
    }

    // 3. Crear la postulación
    const insertData: Record<string, unknown> = {
      oferta_id: ofertaId,
      postulante_id: postulante.id,
      estado: 'recibida',
    }

    // Si cvId es un UUID válido (no 'legacy' ni 'perfil_solamente'), se asocia cv_id
    if (cvId && cvId !== 'perfil_solamente' && cvId !== 'legacy') {
      insertData.cv_id = cvId
    }

    let { error: postulaError } = await supabase.from('postulaciones').insert(insertData)

    // Fallback si la columna cv_id aún no existe en la base de datos (antes de correr migración)
    if (postulaError && (postulaError.message?.includes('cv_id') || postulaError.code === '42703' || postulaError.code === 'PGRST204')) {
      const fallback = await supabase.from('postulaciones').insert({
        oferta_id: ofertaId,
        postulante_id: postulante.id,
        estado: 'recibida',
      })
      postulaError = fallback.error
    }

    if (postulaError) {
      if (postulaError.code === '23505') {
        return { ok: false, error: 'Ya te has postulado a esta oferta de trabajo.' }
      }
      return { ok: false, error: `Error al postularse: ${postulaError.message}` }
    }

    revalidatePath(`/ofertas/${ofertaId}`)
    return { ok: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado al enviar la postulación.'
    return { ok: false, error: message }
  }
}
