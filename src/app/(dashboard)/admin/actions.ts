'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verificarYAsignarCursoCIT } from '@/lib/verificar-cit'

export async function moderarOferta(
  ofertaId: string,
  nuevoEstado: 'publicada' | 'rechazada' | 'cerrada' | 'pendiente' | 'borrador',
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

    if (!usuario || (usuario.rol !== 'municipalidad' && usuario.rol !== 'superadmin')) {
      return { ok: false, error: 'Permisos insuficientes. Solo la municipalidad puede moderar ofertas.' }
    }

    // Si la oferta ya está cerrada, no se permite volver a abrirla
    const { data: ofertaExistente } = await supabaseAdmin
      .from('ofertas')
      .select('estado')
      .eq('id', ofertaId)
      .single()

    if (ofertaExistente?.estado === 'cerrada') {
      return { ok: false, error: 'La oferta ya se encuentra cerrada y no se puede volver a abrir.' }
    }

    // El rechazo requiere motivo obligatorio y pasa la oferta a estado 'borrador'
    // para que la empresa pueda editar lo observado y volver a enviarla a revisión
    if (nuevoEstado === 'rechazada' || nuevoEstado === 'borrador') {
      const motivo = motivoRechazo?.trim()
      if (!motivo) {
        return { ok: false, error: 'Debés ingresar el motivo del rechazo para que la empresa pueda corregir la oferta.' }
      }

      // Guardar motivo y cambiar estado a 'borrador'
      const updatePayload: Record<string, unknown> = {
        estado: 'borrador',
        motivo_rechazo: motivo,
      }

      let { error } = await supabaseAdmin.from('ofertas').update(updatePayload).eq('id', ofertaId)

      // Fallback si la columna motivo_rechazo aún no existe en BD
      if (error && error.message?.includes('motivo_rechazo')) {
        const fallback = await supabaseAdmin.from('ofertas').update({ estado: 'borrador' }).eq('id', ofertaId)
        error = fallback.error
      }

      if (error) {
        return { ok: false, error: `No se pudo rechazar la oferta: ${error.message}` }
      }

      // Notificar a la empresa
      try {
        const { data: oferta } = await supabaseAdmin
          .from('ofertas')
          .select('titulo, empresa_id')
          .eq('id', ofertaId)
          .single()

        if (oferta?.empresa_id) {
          const { data: empresa } = await supabaseAdmin
            .from('empresas')
            .select('usuario_id')
            .eq('id', oferta.empresa_id)
            .single()

          if (empresa?.usuario_id) {
            await supabaseAdmin.from('notificaciones').insert({
              usuario_id: empresa.usuario_id,
              titulo: `Oferta laboral en borrador por correcciones`,
              mensaje: `Tu oferta "${oferta.titulo}" fue observada por el municipio: "${motivo}". Quedó guardada como borrador para que puedas corregir lo indicado y reenviarla.`,
              tipo: 'alerta',
              metadata: {
                oferta_id: ofertaId,
                motivo_rechazo: motivo,
              },
            })
          }
        }
      } catch (notifErr) {
        console.error('[moderarOferta] Error al notificar:', notifErr)
      }

      revalidatePath('/admin')
      revalidatePath('/admin/postulantes')
      revalidatePath('/ofertas')
      revalidatePath(`/ofertas/${ofertaId}`)
      revalidatePath('/empresa')
      return { ok: true }
    }

    // Para otros estados (publicada, cerrada, pendiente):
    const payload: Record<string, unknown> = { estado: nuevoEstado }
    if (nuevoEstado === 'publicada') {
      payload.motivo_rechazo = null
    }

    let { error } = await supabaseAdmin.from('ofertas').update(payload).eq('id', ofertaId)

    if (error && error.message?.includes('motivo_rechazo')) {
      const fallback = await supabaseAdmin.from('ofertas').update({ estado: nuevoEstado }).eq('id', ofertaId)
      error = fallback.error
    }

    if (error) {
      return { ok: false, error: `No se pudo actualizar el estado: ${error.message}` }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/postulantes')
    revalidatePath('/ofertas')
    revalidatePath(`/ofertas/${ofertaId}`)
    revalidatePath('/empresa')
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

    if (!usuario || (usuario.rol !== 'municipalidad' && usuario.rol !== 'superadmin')) {
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

    // Notificar a la empresa de la decisión tomada por la administración
    try {
      const { data: emp } = await supabaseAdmin
        .from('empresas')
        .select('usuario_id, razon_social')
        .eq('id', empresaId)
        .single()

      if (emp?.usuario_id) {
        if (nuevoEstado === 'aprobada') {
          await supabaseAdmin.from('notificaciones').insert({
            usuario_id: emp.usuario_id,
            titulo: '¡Perfil de empresa confirmado y habilitado!',
            mensaje: 'La administración municipal de Funes aprobó tu cuenta de empresa. Ya podés acceder al panel y publicar tus búsquedas laborales.',
            tipo: 'exito',
            metadata: {
              link: '/empresa',
              estado: 'aprobada',
            },
          })
        } else if (nuevoEstado === 'rechazada') {
          const motivoLimpio = motivoRechazo?.trim() || 'Datos no validados'
          await supabaseAdmin.from('notificaciones').insert({
            usuario_id: emp.usuario_id,
            titulo: 'Perfil de empresa observado',
            mensaje: `La administración municipal revisó tu registro y solicitó correcciones. Motivo: "${motivoLimpio}". Ingresá para modificar tus datos y volver a enviar la solicitud.`,
            tipo: 'alerta',
            metadata: {
              link: '/empresa',
              estado: 'rechazada',
              motivo: motivoLimpio,
            },
          })
        }
      }
    } catch (notifErr) {
      console.error('Error al notificar a la empresa:', notifErr)
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

    if (!usuario || (usuario.rol !== 'municipalidad' && usuario.rol !== 'superadmin')) {
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

    if (!usuario || (usuario.rol !== 'municipalidad' && usuario.rol !== 'superadmin')) {
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

    // 3. Obtener el postulante_id para verificar si alcanza 3 rechazos
    try {
      const { data: postu } = await supabaseAdmin
        .from('postulaciones')
        .select('postulante_id')
        .eq('id', postulacionId)
        .single()

      if (postu?.postulante_id) {
        await verificarYAsignarCursoCIT(postu.postulante_id)
      }
    } catch (citErr) {
      console.error('Error al verificar CIT al descartar postulación:', citErr)
    }

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

    if (!usuario || (usuario.rol !== 'municipalidad' && usuario.rol !== 'superadmin')) {
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

    if (!usuario || (usuario.rol !== 'municipalidad' && usuario.rol !== 'superadmin')) {
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

    // Enviar notificación interna al postulante
    try {
      const fechaObj = new Date(data.fechaHora)
      const fechaFormateada = fechaObj.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires',
      })
      const horaFormateada = fechaObj.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires',
      })
      const lugar = data.lugarModalidad?.trim() || 'Presencial en Oficina de Empleo'
      const esReprogramacion = !!data.preentrevistaId

      const { data: postulacionData } = await supabaseAdmin
        .from('postulaciones')
        .select('postulante:postulantes(usuario_id)')
        .eq('id', data.postulacionId)
        .single()

      const postulacion = postulacionData as {
        postulante: { usuario_id: string } | { usuario_id: string }[] | null
      } | null
      const postulanteRaw = Array.isArray(postulacion?.postulante)
        ? postulacion?.postulante[0]
        : postulacion?.postulante
      const usuarioId = postulanteRaw?.usuario_id

      if (usuarioId) {
        await supabaseAdmin.from('notificaciones').insert({
          usuario_id: usuarioId,
          titulo: esReprogramacion ? 'Entrevista reprogramada' : '📅 Nueva entrevista programada',
          mensaje: esReprogramacion
            ? `Tu entrevista fue reprogramada para el ${fechaFormateada} a las ${horaFormateada}. Lugar / Modalidad: ${lugar}.`
            : `La Oficina de Empleo Municipal programó una entrevista para vos. Fecha: ${fechaFormateada} — Hora: ${horaFormateada}. Lugar / Modalidad: ${lugar}.`,
          tipo: 'entrevista',
          metadata: {
            fecha_hora: data.fechaHora,
            lugar_modalidad: lugar,
            postulacion_id: data.postulacionId,
          },
        })
      }
    } catch (notifErr) {
      console.error('Error al crear notificación de entrevista:', notifErr)
    }

    revalidatePath('/admin')
    revalidatePath('/admin/postulantes')
    revalidatePath('/postulaciones')
    revalidatePath('/notificaciones')
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

    if (!usuario || (usuario.rol !== 'municipalidad' && usuario.rol !== 'superadmin')) {
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
