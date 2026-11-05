'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verificarYAsignarCursoCIT } from '@/lib/verificar-cit'

export async function crearOfertaEmpresa(data: {
  titulo: string
  descripcion: string
  categoriaId?: string
  modalidad?: string
  estado?: 'publicada' | 'pendiente'
  fechaInicioSeleccion?: string
  duracionDias?: number
  salario?: number | string | null
}) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { ok: false, error: 'Debes iniciar sesión para publicar ofertas.' }
    }

    // 1. Verificar perfil de empresa
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (usuario?.rol !== 'empresa') {
      return { ok: false, error: 'Solo las empresas registradas pueden publicar ofertas.' }
    }

    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, razon_social, estado_aprobacion')
      .eq('usuario_id', user.id)
      .single()

    if (empresaError || !empresa) {
      return { ok: false, error: 'No se encontró el perfil de tu empresa.' }
    }

    if (empresa.estado_aprobacion !== 'aprobada') {
      return {
        ok: false,
        error: 'Tu perfil de empresa está en revisión o no ha sido aprobado aún. Podrás publicar ofertas laborales una vez confirmada por la administración.',
      }
    }

    // Calcular período de selección (entre 30 y 60 días)
    const duracionFinal = Math.min(Math.max(Number(data.duracionDias) || 30, 30), 60)
    const hoyStr = new Date().toISOString().split('T')[0]
    const fechaInicioFinal = data.fechaInicioSeleccion && !isNaN(Date.parse(data.fechaInicioSeleccion))
      ? data.fechaInicioSeleccion
      : hoyStr

    const fechaInicioObj = new Date(fechaInicioFinal + 'T00:00:00')
    const fechaFinObj = new Date(fechaInicioObj)
    fechaFinObj.setDate(fechaFinObj.getDate() + duracionFinal)
    const fechaFinStr = fechaFinObj.toISOString().split('T')[0]

    // Formatear fechas para texto legible en español
    const fechaInicioFormato = fechaInicioObj.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const fechaFinFormato = fechaFinObj.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    // Preparar descripción integrando la modalidad si se especificó
    let descripcionFinal = data.descripcion.trim()
    if (data.modalidad && data.modalidad !== 'no_especificada') {
      const modalidadTexto = `\n\nModalidad: ${data.modalidad.charAt(0).toUpperCase() + data.modalidad.slice(1)}`
      if (!descripcionFinal.toLowerCase().includes('modalidad:')) {
        descripcionFinal += modalidadTexto
      }
    }

    // Añadir aclaración clara del período de selección en la descripción para compatibilidad total
    const periodoTexto = `\n\n📅 Proceso de Selección:\n• Comienzo de selección: ${fechaInicioFormato}\n• Período de convocatoria: ${duracionFinal} días (hasta el ${fechaFinFormato})`
    if (!descripcionFinal.includes('Proceso de Selección:')) {
      descripcionFinal += periodoTexto
    }

    // 2. Procesar salario opcional
    const salarioValido =
      data.salario !== undefined &&
      data.salario !== null &&
      data.salario !== '' &&
      !isNaN(Number(data.salario)) &&
      Number(data.salario) > 0
        ? Number(data.salario)
        : null

    // 3. Insertar la oferta en estado pendiente
    let nuevaOferta: { id: string } | null = null

    // Payload completo (con columnas de duración y salario si están disponibles)
    const insertPayloadBase = {
      empresa_id: empresa.id,
      empresa_nombre: empresa.razon_social,
      titulo: data.titulo.trim(),
      descripcion: descripcionFinal,
      estado: 'pendiente',
      fecha_inicio_seleccion: fechaInicioFinal,
      duracion_dias: duracionFinal,
      fecha_fin_seleccion: fechaFinStr,
    }

    // Payload mínimo (solo columnas base que siempre existen)
    const insertPayloadMinimo = {
      empresa_id: empresa.id,
      empresa_nombre: empresa.razon_social,
      titulo: data.titulo.trim(),
      descripcion: descripcionFinal,
      estado: 'pendiente',
    }

    const insertPayload: Record<string, unknown> = { ...insertPayloadBase }
    if (salarioValido !== null) {
      insertPayload.salario = salarioValido
    }

    // Helper para detectar errores de columna faltante (migración pendiente)
    const esErrorColumnaFaltante = (msg?: string | null) =>
      (msg?.includes('column') && msg?.includes('schema cache')) ||
      msg?.toLowerCase().includes('could not find') ||
      msg?.toLowerCase().includes('duracion_dias') ||
      msg?.toLowerCase().includes('fecha_inicio_seleccion') ||
      msg?.toLowerCase().includes('fecha_fin_seleccion') ||
      msg?.toLowerCase().includes('salario')

    const { data: resInsert, error: errInsert } = await supabaseAdmin
      .from('ofertas')
      .insert(insertPayload)
      .select('id')
      .single()

    if (!errInsert) {
      // Intento 1 exitoso (todas las columnas disponibles)
      nuevaOferta = resInsert
    } else if (esErrorColumnaFaltante(errInsert.message)) {
      // Intento 2: sin salario pero con columnas de duración
      console.warn('[crearOfertaEmpresa] Columna faltante en intento 1, reintentando sin salario:', errInsert.message)
      const { data: resIntento2, error: errIntento2 } = await supabaseAdmin
        .from('ofertas')
        .insert(insertPayloadBase)
        .select('id')
        .single()

      if (!errIntento2) {
        nuevaOferta = resIntento2
        console.warn('[crearOfertaEmpresa] Intento 2 exitoso (sin salario). Ejecutá migration_020_salario_ofertas.sql.')
      } else if (esErrorColumnaFaltante(errIntento2.message)) {
        // Intento 3: payload mínimo (sin columnas de duración ni salario)
        console.warn('[crearOfertaEmpresa] Columna faltante en intento 2, reintentando con payload mínimo:', errIntento2.message)
        const { data: resIntento3, error: errIntento3 } = await supabaseAdmin
          .from('ofertas')
          .insert(insertPayloadMinimo)
          .select('id')
          .single()

        if (!errIntento3) {
          nuevaOferta = resIntento3
          console.warn('[crearOfertaEmpresa] Intento 3 exitoso (payload mínimo). Ejecutá migration_014 y migration_020 en Supabase.')
        } else {
          return { ok: false, error: `Error al guardar la oferta: ${errIntento3.message}` }
        }
      } else {
        return { ok: false, error: `Error al guardar la oferta: ${errIntento2.message}` }
      }
    } else {
      return { ok: false, error: `Error al guardar la oferta: ${errInsert.message}` }
    }

    // 3. Vincular categoría si fue seleccionada
    if (data.categoriaId) {
      if (!nuevaOferta) {
        return { ok: false, error: 'Error inesperado: no se obtuvo el ID de la oferta creada.' }
      }
      await supabaseAdmin.from('oferta_categorias').insert({
        oferta_id: nuevaOferta.id,
        categoria_id: data.categoriaId,
      })
    }

    revalidatePath('/empresa')
    revalidatePath('/ofertas')
    if (!nuevaOferta) {
      return { ok: false, error: 'Error inesperado: no se pudo recuperar el ID de la oferta.' }
    }
    return { ok: true, id: nuevaOferta.id }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al crear la oferta'
    return { ok: false, error: msg }
  }
}

export async function cambiarEstadoOferta(ofertaId: string, nuevoEstado: 'publicada' | 'cerrada' | 'pendiente') {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { ok: false, error: 'No autorizado' }
    }

    // Obtener razón social de la empresa
    const { data: empresa } = await supabase
      .from('empresas')
      .select('razon_social')
      .eq('usuario_id', user.id)
      .single()

    if (!empresa) {
      return { ok: false, error: 'No se encontró la empresa' }
    }

    // Las empresas solo pueden cerrar una oferta, no pueden activarla/publicarla directamente (eso lo hace el administrador)
    if (nuevoEstado === 'publicada') {
      return { ok: false, error: 'Solo la administración municipal puede activar o publicar ofertas.' }
    }

    // Actualizar estado de la oferta asegurando que pertenezca a la empresa
    const { error: updateError } = await supabaseAdmin
      .from('ofertas')
      .update({ estado: nuevoEstado })
      .eq('id', ofertaId)
      .eq('empresa_nombre', empresa.razon_social)

    if (updateError) {
      return { ok: false, error: updateError.message }
    }

    revalidatePath('/empresa')
    revalidatePath('/ofertas')
    revalidatePath(`/ofertas/${ofertaId}`)
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar el estado'
    return { ok: false, error: msg }
  }
}

export async function actualizarEstadoDerivacion(
  derivacionId: string,
  estadoEmpresa: 'pendiente' | 'en_proceso' | 'contratado' | 'rechazado',
  notaEmpresa?: string
) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { ok: false, error: 'No autorizado' }

    // Validación obligatoria de motivo en caso de no contratación (rechazo)
    if (estadoEmpresa === 'rechazado') {
      const motivoLimpio = (notaEmpresa ?? '').trim()
      if (!motivoLimpio) {
        return { ok: false, error: 'Es obligatorio registrar el motivo por el cual no se contrata al candidato.' }
      }
    }

    const { error } = await supabaseAdmin
      .from('derivaciones')
      .update({
        estado_empresa: estadoEmpresa,
        nota_empresa: notaEmpresa?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', derivacionId)

    if (error) return { ok: false, error: error.message }

    // Obtener datos de la derivación, postulación, oferta y empresa para notificaciones precisas
    const { data: derivacionInfo } = await supabaseAdmin
      .from('derivaciones')
      .select(`
        postulacion_id,
        postulacion:postulaciones (
          id,
          postulante_id,
          postulante:postulantes (
            id,
            usuario_id,
            usuario:usuarios (
              id,
              nombre,
              apellido
            )
          ),
          oferta:ofertas (
            id,
            titulo,
            empresa_nombre
          )
        )
      `)
      .eq('id', derivacionId)
      .maybeSingle()

    const postulacionObj = Array.isArray(derivacionInfo?.postulacion)
      ? derivacionInfo?.postulacion[0]
      : derivacionInfo?.postulacion

    const postulanteObj = Array.isArray(postulacionObj?.postulante)
      ? postulacionObj?.postulante[0]
      : postulacionObj?.postulante

    const usuarioObj = Array.isArray(postulanteObj?.usuario)
      ? postulanteObj?.usuario[0]
      : postulanteObj?.usuario

    const ofertaObj = Array.isArray(postulacionObj?.oferta)
      ? postulacionObj?.oferta[0]
      : postulacionObj?.oferta

    const postulanteUsuarioId = postulanteObj?.usuario_id
    const postulanteId = postulanteObj?.id || postulacionObj?.postulante_id
    const postulanteNombreCompleto = [usuarioObj?.nombre, usuarioObj?.apellido].filter(Boolean).join(' ') || 'El postulante'
    const ofertaTitulo = ofertaObj?.titulo || 'la búsqueda laboral'
    const empresaNombre = ofertaObj?.empresa_nombre || 'La empresa'

    // Obtener postulante_id de forma directa y confiable (fallback si el join anidado falló)
    let postulanteIdConfiable: string | null = postulanteId || null
    if (!postulanteIdConfiable && derivacionInfo?.postulacion_id) {
      const { data: postulacionDirecta } = await supabaseAdmin
        .from('postulaciones')
        .select('postulante_id')
        .eq('id', derivacionInfo.postulacion_id)
        .single()
      postulanteIdConfiable = postulacionDirecta?.postulante_id || null
    }

    // Si la empresa marcó como rechazado (no contrata):
    if (estadoEmpresa === 'rechazado') {
      const motivoRegistrado = notaEmpresa?.trim() || 'No especificado'

      // 1. Notificar al postulante con el motivo del rechazo
      if (postulanteUsuarioId) {
        try {
          await supabaseAdmin.from('notificaciones').insert({
            usuario_id: postulanteUsuarioId,
            titulo: `Resultado de postulación: ${ofertaTitulo}`,
            mensaje: `${empresaNombre} informó que no fuiste contratado para el puesto "${ofertaTitulo}". Motivo: "${motivoRegistrado}".`,
            tipo: 'alerta',
            metadata: {
              derivacion_id: derivacionId,
              oferta_id: ofertaObj?.id,
              motivo_rechazo: motivoRegistrado,
            },
          })
        } catch (notifCandErr) {
          console.error('Error al notificar al candidato del rechazo:', notifCandErr)
        }
      }

      // 2. Notificar a la administración municipal (todos los usuarios con rol 'municipalidad')
      try {
        const { data: adminUsers } = await supabaseAdmin
          .from('usuarios')
          .select('id')
          .eq('rol', 'municipalidad')

        if (adminUsers && adminUsers.length > 0) {
          const notificacionesMuni = adminUsers.map((u: { id: string }) => ({
            usuario_id: u.id,
            titulo: `${postulanteNombreCompleto} fue rechazado por ${empresaNombre}`,
            mensaje: `${postulanteNombreCompleto} fue rechazado por ${empresaNombre} para el puesto "${ofertaTitulo}". Motivo: "${motivoRegistrado}".`,
            tipo: 'alerta',
            metadata: {
              derivacion_id: derivacionId,
              oferta_id: ofertaObj?.id,
              postulante_id: postulanteId,
              motivo_rechazo: motivoRegistrado,
            },
          }))
          await supabaseAdmin.from('notificaciones').insert(notificacionesMuni)
        }
      } catch (notifAdminErr) {
        console.error('Error al notificar a administración del rechazo:', notifAdminErr)
      }

      // 3. Verificar si el postulante acumula 3 rechazos para enviarlo al curso CIT
      if (postulanteId) {
        try {
          await verificarYAsignarCursoCIT(postulanteId)
        } catch (citErr) {
          console.error('Error al verificar CIT tras rechazo:', citErr)
        }
      }
    }

    // Si la empresa marcó como contratado:
    if (estadoEmpresa === 'contratado') {
      // 1. Actualizar estado_laboral del postulante a 'trabajando' automáticamente
      if (postulanteIdConfiable) {
        try {
          const { error: estadoErr } = await supabaseAdmin
            .from('postulantes')
            .update({ estado_laboral: 'trabajando' })
            .eq('id', postulanteIdConfiable)

          if (estadoErr) {
            console.error('[contratado] Error al actualizar estado_laboral:', estadoErr.message)
          } else {
            console.log('[contratado] estado_laboral → "trabajando" para postulante:', postulanteIdConfiable)
          }
        } catch (estadoEx) {
          console.error('[contratado] Excepción al actualizar estado_laboral:', estadoEx)
        }
      } else {
        console.warn('[contratado] No se pudo determinar el postulanteId para actualizar estado_laboral')
      }

      // 2. Notificar al candidato de la contratación
      if (postulanteUsuarioId) {
        try {
          await supabaseAdmin.from('notificaciones').insert({
            usuario_id: postulanteUsuarioId,
            titulo: `¡Felicitaciones! Fuiste contratado`,
            mensaje: `¡Excelente noticia! ${empresaNombre} confirmó tu contratación para el puesto "${ofertaTitulo}". Pronto se pondrán en contacto para coordinar el ingreso.`,
            tipo: 'contratado',
            metadata: {
              derivacion_id: derivacionId,
              oferta_id: ofertaObj?.id,
            },
          })
        } catch (notifCandErr) {
          console.error('Error al notificar al candidato de la contratación:', notifCandErr)
        }
      }

      // 3. Notificar a administración municipal
      try {
        const { data: adminUsers } = await supabaseAdmin
          .from('usuarios')
          .select('id')
          .eq('rol', 'municipalidad')

        if (adminUsers && adminUsers.length > 0) {
          const notificaciones = adminUsers.map((u: { id: string }) => ({
            usuario_id: u.id,
            titulo: `${postulanteNombreCompleto} fue contratado por ${empresaNombre}`,
            mensaje: `${postulanteNombreCompleto} fue contratado por ${empresaNombre} para el puesto "${ofertaTitulo}".`,
            tipo: 'contratado',
            metadata: {
              derivacion_id: derivacionId,
              oferta_id: ofertaObj?.id,
              postulante_id: postulanteId,
            },
          }))
          await supabaseAdmin.from('notificaciones').insert(notificaciones)
        }
      } catch (notifErr) {
        console.error('Error al notificar a administración:', notifErr)
      }
    }

    revalidatePath('/empresa')
    revalidatePath('/admin')
    revalidatePath('/admin/postulantes')
    revalidatePath('/admin/rechazados')
    revalidatePath('/postulaciones')
    revalidatePath('/inicio')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar la derivación'
    return { ok: false, error: msg }
  }
}

export async function reenviarPerfilEmpresaRevision(data: {
  razon_social: string
  cuit: string
  rubro: string
  descripcion?: string
  email: string
  nombre: string
  apellido: string
  telefono: string
}) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { ok: false, error: 'Debes iniciar sesión para realizar esta acción.' }
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (usuario?.rol !== 'empresa') {
      return { ok: false, error: 'No autorizado. Se requiere cuenta de empresa.' }
    }

    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('usuario_id', user.id)
      .single()

    if (!empresa) {
      return { ok: false, error: 'No se encontró el perfil de empresa.' }
    }

    // 1. Actualizar empresa y volver a estado 'pendiente' limpiando motivo de rechazo
    const { error: errorEmpresa } = await supabaseAdmin
      .from('empresas')
      .update({
        razon_social: data.razon_social.trim(),
        cuit: data.cuit.trim(),
        rubro: data.rubro.trim(),
        descripcion: data.descripcion?.trim() || null,
        email: data.email.trim(),
        estado_aprobacion: 'pendiente',
        motivo_rechazo: null,
      })
      .eq('id', empresa.id)

    if (errorEmpresa) {
      if (errorEmpresa.code === '23505') {
        return { ok: false, error: 'Ya existe una empresa registrada con ese CUIT' }
      }
      return { ok: false, error: `Error al actualizar datos de la empresa: ${errorEmpresa.message}` }
    }

    // 2. Actualizar datos del usuario responsable
    const { error: errorUsuario } = await supabaseAdmin
      .from('usuarios')
      .update({
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        telefono: data.telefono.trim(),
      })
      .eq('id', user.id)

    if (errorUsuario) {
      return { ok: false, error: `Error al actualizar datos de contacto: ${errorUsuario.message}` }
    }

    // 3. Notificar a la administración municipal
    try {
      const { data: adminUsers } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('rol', 'municipalidad')

      if (adminUsers && adminUsers.length > 0) {
        const notificacionesMuni = adminUsers.map((u: { id: string }) => ({
          usuario_id: u.id,
          titulo: `Solicitud de empresa reenviada: ${data.razon_social.trim()}`,
          mensaje: `La empresa "${data.razon_social.trim()}" (CUIT: ${data.cuit.trim()}) actualizó sus datos y solicitó una nueva confirmación por parte de la administración municipal.`,
          tipo: 'alerta',
          metadata: {
            tipo: 'empresa_reenvio',
            link: '/admin/empresas',
            link_texto: 'Ir a aprobación de empresas',
            cuit: data.cuit.trim(),
            razon_social: data.razon_social.trim(),
          },
        }))
        await supabaseAdmin.from('notificaciones').insert(notificacionesMuni)
      }
    } catch (notifErr) {
      console.error('Error al notificar a administración del reenvío:', notifErr)
    }

    revalidatePath('/empresa')
    revalidatePath('/empresa/perfil')
    revalidatePath('/admin')
    revalidatePath('/admin/empresas')

    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al reenviar la solicitud'
    return { ok: false, error: msg }
  }
}
