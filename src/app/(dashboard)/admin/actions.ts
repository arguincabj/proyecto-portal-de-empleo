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

export async function moderarEmpresa(
  empresaId: string,
  nuevoEstado: 'aprobada' | 'rechazada' | 'pendiente',
  motivoRechazo?: string
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
      return { ok: false, error: 'Permisos insuficientes. Solo la municipalidad puede aprobar empresas.' }
    }

    const payload: { estado_aprobacion: string; motivo_rechazo?: string | null } = {
      estado_aprobacion: nuevoEstado,
    }

    if (nuevoEstado === 'rechazada') {
      payload.motivo_rechazo = motivoRechazo?.trim() || null
    } else if (nuevoEstado === 'aprobada') {
      payload.motivo_rechazo = null
    }

    let { error } = await supabaseAdmin
      .from('empresas')
      .update(payload)
      .eq('id', empresaId)

    if (error && error.message?.includes('motivo_rechazo')) {
      const fallback = await supabaseAdmin
        .from('empresas')
        .update({ estado_aprobacion: nuevoEstado })
        .eq('id', empresaId)
      error = fallback.error
    }

    if (error) {
      return { ok: false, error: `No se pudo actualizar el estado: ${error.message}` }
    }

    revalidatePath('/admin')
    revalidatePath('/empresa/perfil')
    revalidatePath('/empresa')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al moderar la empresa'
    return { ok: false, error: msg }
  }
}

export async function derivarPostulante(postulacionId: string, notaMunicipalidad?: string) {
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
      return { ok: false, error: 'Permisos insuficientes. Solo el personal municipal puede derivar postulantes.' }
    }

    // 1. Actualizar estado de la postulación a 'derivada'
    const { error: errorPost } = await supabaseAdmin
      .from('postulaciones')
      .update({ estado: 'derivada' })
      .eq('id', postulacionId)

    if (errorPost) {
      return { ok: false, error: `Error al actualizar postulación: ${errorPost.message}` }
    }

    // 2. Registrar en la tabla de derivaciones (o actualizar si ya existía)
    const { error: errorDerivacion } = await supabaseAdmin
      .from('derivaciones')
      .upsert(
        {
          postulacion_id: postulacionId,
          municipalidad_usuario_id: user.id,
          nota_municipalidad: notaMunicipalidad?.trim() || 'Derivado por la Dirección de Empleo Municipal',
          estado_empresa: 'pendiente',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'postulacion_id' }
      )

    if (errorDerivacion) {
      return { ok: false, error: `Error al crear derivación: ${errorDerivacion.message}` }
    }

    revalidatePath('/admin')
    revalidatePath('/empresa')
    revalidatePath('/postulaciones')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al derivar postulante'
    return { ok: false, error: msg }
  }
}
