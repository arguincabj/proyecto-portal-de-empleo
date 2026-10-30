'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verificarYAsignarCursoCIT } from '@/lib/verificar-cit'

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
    revalidatePath('/admin/postulantes')
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
    revalidatePath('/admin/empresas')
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
    revalidatePath('/admin/postulantes')
    revalidatePath('/empresa')
    revalidatePath('/postulaciones')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al derivar postulante'
    return { ok: false, error: msg }
  }
}

export async function noEnviarPostulante(postulacionId: string) {
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
      return { ok: false, error: 'Permisos insuficientes. Solo el personal municipal puede moderar postulantes.' }
    }

    // 1. Actualizar estado de la postulación a 'rechazada_municipalidad'
    const { error: errorPost } = await supabaseAdmin
      .from('postulaciones')
      .update({ estado: 'rechazada_municipalidad' })
      .eq('id', postulacionId)

    if (errorPost) {
      return { ok: false, error: `Error al actualizar postulación: ${errorPost.message}` }
    }

    // 2. Si existía derivación previa enviada a la empresa, eliminarla para que la empresa no la vea
    await supabaseAdmin
      .from('derivaciones')
      .delete()
      .eq('postulacion_id', postulacionId)

    revalidatePath('/admin')
    revalidatePath('/admin/postulantes')
    revalidatePath('/empresa')
    revalidatePath('/postulaciones')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al descartar postulante'
    return { ok: false, error: msg }
  }
}

export async function reabrirPostulante(postulacionId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'No autorizado. Iniciá sesión.' }
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!usuario || usuario.rol !== 'municipalidad') {
      return { ok: false, error: 'Permisos insuficientes.' }
    }

    const { error: errorPost } = await supabaseAdmin
      .from('postulaciones')
      .update({ estado: 'recibida' })
      .eq('id', postulacionId)

    if (errorPost) {
      return { ok: false, error: `Error al reabrir postulación: ${errorPost.message}` }
    }

    await supabaseAdmin
      .from('derivaciones')
      .delete()
      .eq('postulacion_id', postulacionId)

    revalidatePath('/admin')
    revalidatePath('/admin/postulantes')
    revalidatePath('/empresa')
    revalidatePath('/postulaciones')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { ok: false, error: msg }
  }
}

export type PreentrevistaItem = {
  id: string
  postulacion_id: string
  municipalidad_usuario_id?: string
  fecha_hora: string
  lugar_modalidad: string
  estado: 'programada' | 'reprogramada' | 'completada' | 'cancelada'
  notas?: string | null
  resultado?: 'aprobada' | 'no_asistio' | 'desfavorable' | 'pendiente' | null
  created_at?: string
  updated_at?: string
}

export async function agendarOActualizarPreentrevista(data: {
  preentrevistaId?: string
  postulacionId: string
  fechaHora: string
  lugarModalidad?: string
  notas?: string
  estado?: 'programada' | 'reprogramada' | 'completada' | 'cancelada'
  resultado?: 'aprobada' | 'no_asistio' | 'desfavorable' | 'pendiente'
}) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'No autorizado. Iniciá sesión.' }
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!usuario || usuario.rol !== 'municipalidad') {
      return { ok: false, error: 'Permisos insuficientes. Solo el personal municipal puede gestionar preentrevistas.' }
    }

    if (!data.fechaHora) {
      return { ok: false, error: 'Debés especificar una fecha y hora.' }
    }

    // Validar que la fecha acordada no sea anterior a hoy/ahora (tolerancia de 2 min)
    const fechaSeleccionada = new Date(data.fechaHora)
    const ahora = new Date()
    if (fechaSeleccionada.getTime() < ahora.getTime() - 2 * 60 * 1000) {
      return { ok: false, error: 'La fecha y hora acordada no puede ser anterior al momento actual.' }
    }

    const payload = {
      postulacion_id: data.postulacionId,
      municipalidad_usuario_id: user.id,
      fecha_hora: data.fechaHora,
      lugar_modalidad: data.lugarModalidad?.trim() || 'Presencial en Oficina de Empleo',
      notas: data.notas?.trim() || null,
      estado: data.estado || (data.preentrevistaId ? 'reprogramada' : 'programada'),
      resultado: data.resultado || 'pendiente',
      updated_at: new Date().toISOString(),
    }

    if (data.preentrevistaId) {
      const { error } = await supabaseAdmin
        .from('preentrevistas')
        .update(payload)
        .eq('id', data.preentrevistaId)

      if (error) {
        return { ok: false, error: `Error al reprogramar preentrevista: ${error.message}` }
      }
    } else {
      const { error } = await supabaseAdmin
        .from('preentrevistas')
        .insert(payload)

      if (error) {
        return { ok: false, error: `Error al agendar preentrevista: ${error.message}` }
      }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/postulantes')
    revalidatePath('/postulaciones')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al gestionar preentrevista'
    return { ok: false, error: msg }
  }
}

export async function actualizarEstadoPreentrevista(
  preentrevistaId: string,
  estado: 'programada' | 'reprogramada' | 'completada' | 'cancelada',
  resultado?: 'aprobada' | 'no_asistio' | 'desfavorable' | 'pendiente',
  notas?: string
) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'No autorizado. Iniciá sesión.' }
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!usuario || usuario.rol !== 'municipalidad') {
      return { ok: false, error: 'Permisos insuficientes.' }
    }

    const updateData: Record<string, unknown> = {
      estado,
      updated_at: new Date().toISOString(),
    }
    if (resultado) updateData.resultado = resultado
    if (notas !== undefined) updateData.notas = notas

    const { error } = await supabaseAdmin
      .from('preentrevistas')
      .update(updateData)
      .eq('id', preentrevistaId)

    if (error) {
      return { ok: false, error: `Error al actualizar: ${error.message}` }
    }

    // Si el resultado es desfavorable, verificar si acumula 3 rechazos para derivar a CIT
    if (resultado === 'desfavorable') {
      try {
        const { data: pre } = await supabaseAdmin
          .from('preentrevistas')
          .select('postulacion:postulaciones(postulante_id)')
          .eq('id', preentrevistaId)
          .single()

        const postulacionData = Array.isArray(pre?.postulacion)
          ? pre.postulacion[0]
          : pre?.postulacion
        const postulanteId = (postulacionData as { postulante_id?: string } | null | undefined)?.postulante_id
        if (postulanteId) {
          await verificarYAsignarCursoCIT(postulanteId)
        }
      } catch (citErr) {
        console.error('Error al verificar CIT en preentrevista:', citErr)
      }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/postulantes')
    revalidatePath('/postulaciones')
    revalidatePath('/inicio')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar estado de preentrevista'
    return { ok: false, error: msg }
  }
}
