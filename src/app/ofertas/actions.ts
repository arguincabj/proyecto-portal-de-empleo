'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
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
    const { data: usuarioDb } = await supabase
      .from('usuarios')
      .select('rol, nombre, apellido, telefono')
      .eq('id', user.id)
      .single()

    let usuario = usuarioDb
    if (!usuario) {
      const { data: adminUsuario } = await supabaseAdmin
        .from('usuarios')
        .select('rol, nombre, apellido, telefono')
        .eq('id', user.id)
        .single()
      usuario = adminUsuario
    }

    if (!usuario) {
      return { ok: false, error: 'No se encontró información de tu usuario.' }
    }

    if (usuario.rol !== 'postulante') {
      return {
        ok: false,
        error: 'Solo los usuarios registrados como postulantes pueden postularse a ofertas laborales.',
      }
    }

    // 2. Obtener datos de postulante
    let postulante: {
      id: string
      dni: string | null
      localidad?: string | null
      estudios?: string | null
      experiencia?: string | null
      habilidades?: string | null
      cursos?: string | null
      idiomas?: string | null
      horarios?: string | null
      categorias_laborales?: string[] | null
    } | null = null

    const { data: postData } = await supabaseAdmin
      .from('postulantes')
      .select('id, dni, localidad, estudios, experiencia, habilidades, cursos, idiomas, horarios, categorias_laborales')
      .eq('usuario_id', user.id)
      .single()

    if (postData) {
      postulante = postData
    } else {
      const { data: basicPost } = await supabaseAdmin
        .from('postulantes')
        .select('id, dni, estudios, experiencia, habilidades, cursos, idiomas, horarios, categorias_laborales')
        .eq('usuario_id', user.id)
        .single()
      postulante = basicPost ?? null
    }

    if (!postulante) {
      return { ok: false, error: 'No se encontró tu perfil de postulante.' }
    }

    // 3. Validar perfil en el servidor (freno de seguridad)
    // 3.1. Datos personales SIEMPRE obligatorios:
    const tieneNombre = Boolean(usuario.nombre || user.user_metadata?.nombre)
    const tieneApellido = Boolean(usuario.apellido || user.user_metadata?.apellido)
    const tieneTelefono = Boolean(usuario.telefono || user.user_metadata?.telefono)
    const tieneDni = Boolean(postulante.dni || user.user_metadata?.dni)
    const tieneLocalidad = Boolean(postulante.localidad || user.user_metadata?.localidad)
    const datosPersonalesCompletos = tieneNombre && tieneApellido && tieneTelefono && tieneDni && tieneLocalidad

    if (!datosPersonalesCompletos) {
      return {
        ok: false,
        error: 'Debés completar tus datos personales y de contacto (nombre, apellido, teléfono, DNI y localidad) en tu perfil.',
      }
    }

    // 3.2. Categorías de interés SIEMPRE obligatorias (tanto con CV como sin CV)
    const categorias = Array.isArray(postulante.categorias_laborales) ? postulante.categorias_laborales : []
    if (categorias.length === 0) {
      return {
        ok: false,
        error: 'Debés seleccionar al menos una categoría laboral de tu interés en tu perfil antes de postularte.',
      }
    }

    // 3.3. Si se postula con "Solo datos de mi perfil" (sin CV adjunto), todos los campos laborales son obligatorios
    const sePostulaSinCv = !cvId || cvId === 'perfil_solamente'
    if (sePostulaSinCv) {
      const tieneEstudios = Boolean(postulante.estudios && postulante.estudios.trim())
      const tieneCursos = Boolean(postulante.cursos && postulante.cursos.trim())
      const tieneExperiencia = Boolean(postulante.experiencia && postulante.experiencia.trim())
      const tieneHabilidades = Boolean(postulante.habilidades && postulante.habilidades.trim())
      const tieneIdiomas = Boolean(postulante.idiomas && postulante.idiomas.trim())
      const tieneHorarios = Boolean(postulante.horarios && postulante.horarios.trim())

      if (!tieneEstudios || !tieneCursos || !tieneExperiencia || !tieneHabilidades || !tieneIdiomas || !tieneHorarios) {
        return {
          ok: false,
          error: 'Para postularte solo con los datos de tu perfil, debés completar todos los campos del perfil laboral (estudios, cursos, experiencia, habilidades, idiomas y disponibilidad horaria). O bien, seleccioná o subí un currículum vitae en archivo PDF.',
        }
      }
    }

    // 4. Crear la postulación
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

export async function obtenerOfertaParaEditar(ofertaId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'Iniciá sesión para ver esta oferta.' }
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    const { data: oferta, error } = await supabaseAdmin
      .from('ofertas')
      .select('*')
      .eq('id', ofertaId)
      .single()

    if (error || !oferta) {
      return { ok: false, error: 'Oferta no encontrada.' }
    }

    // Si es empresa, verificar que sea la dueña
    if (usuario?.rol === 'empresa') {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id, razon_social')
        .eq('usuario_id', user.id)
        .single()

      const esDuenia =
        (oferta.empresa_id && empresa?.id && oferta.empresa_id === empresa.id) ||
        (empresa?.razon_social &&
          oferta.empresa_nombre?.trim().toLowerCase() === empresa.razon_social.trim().toLowerCase())

      if (!esDuenia) {
        return { ok: false, error: 'No tenés permisos para editar esta oferta.' }
      }
    } else if (usuario?.rol !== 'municipalidad') {
      return { ok: false, error: 'No tenés permisos para editar esta oferta.' }
    }

    // Obtener categoría asociada a la oferta
    let categoriaId: string | null = null
    const { data: catRel } = await supabaseAdmin
      .from('oferta_categorias')
      .select('categoria_id')
      .eq('oferta_id', ofertaId)
      .maybeSingle()

    if (catRel?.categoria_id) {
      categoriaId = catRel.categoria_id
    }

    // Obtener lista completa de categorías para el dropdown
    const { data: categorias } = await supabaseAdmin
      .from('categorias')
      .select('id, nombre')
      .order('nombre', { ascending: true })

    return {
      ok: true,
      oferta,
      categoriaId,
      categorias: categorias ?? [],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener la oferta.'
    return { ok: false, error: message }
  }
}

export async function actualizarOferta(
  ofertaId: string,
  data: {
    titulo: string
    descripcion: string
    categoriaId?: string | null
    modalidad?: string | null
    fechaInicioSeleccion?: string | null
    duracionDias?: number | null
    salario?: number | null
  }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'Iniciá sesión para realizar esta acción.' }
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    const { data: ofertaExistente } = await supabaseAdmin
      .from('ofertas')
      .select('*')
      .eq('id', ofertaId)
      .single()

    if (!ofertaExistente) {
      return { ok: false, error: 'La oferta no existe.' }
    }

    // Permisos
    if (usuario?.rol === 'empresa') {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id, razon_social')
        .eq('usuario_id', user.id)
        .single()

      const esDuenia =
        (ofertaExistente.empresa_id && empresa?.id && ofertaExistente.empresa_id === empresa.id) ||
        (empresa?.razon_social &&
          ofertaExistente.empresa_nombre?.trim().toLowerCase() === empresa.razon_social.trim().toLowerCase())

      if (!esDuenia) {
        return { ok: false, error: 'No tenés permisos para modificar esta oferta.' }
      }
    } else if (usuario?.rol !== 'municipalidad') {
      return { ok: false, error: 'Permisos insuficientes.' }
    }

    // Si estaba en borrador u observada por el municipio, al editarla pasa a 'pendiente' para moderación
    const nuevoEstado = ofertaExistente.estado === 'borrador' ? 'pendiente' : ofertaExistente.estado

    // Calcular fechas si se proporcionó duración o fechaInicio
    let fechaFinStr: string | null = null
    const duracionFinal = data.duracionDias
      ? Math.min(Math.max(Number(data.duracionDias) || 30, 30), 60)
      : (ofertaExistente.duracion_dias || 30)

    const fechaInicioFinal = data.fechaInicioSeleccion || ofertaExistente.fecha_inicio_seleccion

    if (fechaInicioFinal) {
      const fechaInicioObj = new Date(fechaInicioFinal + 'T00:00:00')
      const fechaFinObj = new Date(fechaInicioObj)
      fechaFinObj.setDate(fechaFinObj.getDate() + duracionFinal)
      fechaFinStr = fechaFinObj.toISOString().split('T')[0]
    }

    // Limpiar textos y descripción
    let descripcionFinal = data.descripcion.trim()

    // Si la descripción no contiene la modalidad y se especificó, añadir o actualizar
    if (data.modalidad && data.modalidad !== 'no_especificada') {
      const modTexto = `Modalidad: ${data.modalidad.charAt(0).toUpperCase() + data.modalidad.slice(1)}`
      if (!descripcionFinal.toLowerCase().includes('modalidad:')) {
        descripcionFinal += `\n\n${modTexto}`
      }
    }

    const payload: Record<string, unknown> = {
      titulo: data.titulo.trim(),
      descripcion: descripcionFinal,
      estado: nuevoEstado,
    }

    if (data.salario !== undefined) {
      payload.salario = data.salario
    }
    if (data.duracionDias !== undefined) {
      payload.duracion_dias = duracionFinal
    }
    if (fechaInicioFinal) {
      payload.fecha_inicio_seleccion = fechaInicioFinal
    }
    if (fechaFinStr) {
      payload.fecha_fin_seleccion = fechaFinStr
    }

    let { error: updateError } = await supabaseAdmin
      .from('ofertas')
      .update(payload)
      .eq('id', ofertaId)

    // Fallbacks si columnas como duracion_dias, fecha_* o salario no existen aún
    if (updateError && (updateError.message?.includes('column') || updateError.code === '42703')) {
      // Reintentar sin columnas opcionales/migración reciente
      delete payload.duracion_dias
      delete payload.fecha_inicio_seleccion
      delete payload.fecha_fin_seleccion
      delete payload.salario

      const fallback = await supabaseAdmin
        .from('ofertas')
        .update(payload)
        .eq('id', ofertaId)
      updateError = fallback.error
    }

    if (updateError) {
      return { ok: false, error: `Error al guardar los cambios: ${updateError.message}` }
    }

    // Actualizar categoría asociada
    if (data.categoriaId !== undefined) {
      await supabaseAdmin.from('oferta_categorias').delete().eq('oferta_id', ofertaId)
      if (data.categoriaId) {
        await supabaseAdmin.from('oferta_categorias').insert({
          oferta_id: ofertaId,
          categoria_id: data.categoriaId,
        })
      }
    }

    revalidatePath('/empresa')
    revalidatePath('/admin')
    revalidatePath('/ofertas')
    revalidatePath(`/ofertas/${ofertaId}`)

    return { ok: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al actualizar la oferta.'
    return { ok: false, error: message }
  }
}

export async function actualizarCategoriasPostulante(categorias: string[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { ok: false, error: 'Debes iniciar sesión para realizar esta acción.' }

    if (!Array.isArray(categorias) || categorias.length === 0) {
      return { ok: false, error: 'Debés seleccionar al menos una categoría laboral.' }
    }

    const { error } = await supabaseAdmin
      .from('postulantes')
      .update({ categorias_laborales: categorias })
      .eq('usuario_id', user.id)

    if (error) return { ok: false, error: 'No se pudieron guardar las categorías. Intentá de nuevo.' }

    revalidatePath('/perfil')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error inesperado al guardar las categorías.' }
  }
}
