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
    } | null = null

    const { data: postData } = await supabaseAdmin
      .from('postulantes')
      .select('id, dni, localidad, estudios, experiencia, habilidades, cursos')
      .eq('usuario_id', user.id)
      .single()

    if (postData) {
      postulante = postData
    } else {
      const { data: basicPost } = await supabaseAdmin
        .from('postulantes')
        .select('id, dni, estudios, experiencia, habilidades, cursos')
        .eq('usuario_id', user.id)
        .single()
      postulante = basicPost ?? null
    }

    if (!postulante) {
      return { ok: false, error: 'No se encontró tu perfil de postulante.' }
    }

    // 3. Validar perfil completo en el servidor (freno de seguridad)
    const tieneNombre = Boolean(usuario.nombre || user.user_metadata?.nombre)
    const tieneApellido = Boolean(usuario.apellido || user.user_metadata?.apellido)
    const tieneTelefono = Boolean(usuario.telefono || user.user_metadata?.telefono)
    const tieneDni = Boolean(postulante.dni || user.user_metadata?.dni)
    const tieneLocalidad = Boolean(postulante.localidad || user.user_metadata?.localidad)
    const datosPersonalesCompletos = tieneNombre && tieneApellido && tieneTelefono && tieneDni && tieneLocalidad

    const tieneEstudios = Boolean(postulante.estudios && postulante.estudios.trim())
    const tieneExperiencia = Boolean(postulante.experiencia && postulante.experiencia.trim())
    const tieneHabilidades = Boolean(postulante.habilidades && postulante.habilidades.trim())
    const tieneCursos = Boolean(postulante.cursos && postulante.cursos.trim())
    const datosLaboralesCompletos = tieneEstudios || tieneExperiencia || tieneHabilidades || tieneCursos

    if (!datosPersonalesCompletos || !datosLaboralesCompletos) {
      return {
        ok: false,
        error: 'Tu perfil está incompleto. Completá tus datos personales y laborales antes de postularte.',
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
