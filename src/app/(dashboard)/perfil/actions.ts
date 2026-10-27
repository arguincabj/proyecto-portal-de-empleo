'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { CV_MAX_BYTES } from './cv-limites'

const CV_BUCKET = 'curricula'
const CV_ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const CV_ALLOWED_EXTS = new Set(['pdf', 'doc', 'docx'])

type ActionResult = { ok: true } | { ok: false; error: string }

function nombreSeguro(nombre: string) {
  const base = nombre.replace(/\.[^.]+$/, '')
  const limpio = base
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return limpio || 'cv'
}

function datosCv(path: string) {
  const archivo = path.split('/').pop() ?? ''
  const match = archivo.match(/^(\d+)(?:-(.+))?\.(\w+)$/)
  if (!match) return { nombre: archivo }
  const [, , nombre, ext] = match
  return { nombre: `${nombre ?? 'curriculum'}.${ext}` }
}

export async function actualizarPerfil(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'No autenticado' }

    const { data: usuarioRol } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (usuarioRol?.rol !== 'postulante') return { ok: false, error: 'Acción no disponible para tu tipo de cuenta' }

    const nombre = (formData.get('nombre') as string | null)?.trim() ?? ''
    const apellido = (formData.get('apellido') as string | null)?.trim() ?? ''
    const telefono = (formData.get('telefono') as string | null)?.trim() ?? ''
    const dni = (formData.get('dni') as string | null)?.trim() ?? ''
    const localidad = (formData.get('localidad') as string | null)?.trim() ?? ''
    const direccion = (formData.get('direccion') as string | null)?.trim() ?? ''
    const codigo_postal = (formData.get('codigo_postal') as string | null)?.trim() ?? ''

    if (!nombre || !apellido || !telefono || !dni) {
      return { ok: false, error: 'Nombre, apellido, teléfono y DNI son obligatorios' }
    }

    const { error: errorUsuario } = await supabase
      .from('usuarios')
      .update({ nombre, apellido, telefono })
      .eq('id', user.id)

    if (errorUsuario) return { ok: false, error: 'No se pudieron actualizar los datos personales' }

    // Respaldar siempre en Auth Metadata para garantizar persistencia y disponibilidad
    try {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          nombre,
          apellido,
          telefono,
          dni,
          localidad,
          direccion,
          codigo_postal,
        },
      })
    } catch (authErr) {
      console.error('Error al actualizar metadata de auth:', authErr)
    }

    const updatePostulante: Record<string, string | null> = { dni }
    updatePostulante.localidad = localidad
    updatePostulante.direccion = direccion
    updatePostulante.codigo_postal = codigo_postal

    let { error: errorPostulante } = await supabaseAdmin
      .from('postulantes')
      .update(updatePostulante)
      .eq('usuario_id', user.id)

    // Fallback si la migración 011 aún no fue corrida en Supabase
    if (
      errorPostulante &&
      (errorPostulante.message?.includes('column') ||
        errorPostulante.code === '42703' ||
        errorPostulante.code === 'PGRST204')
    ) {
      const fallback = await supabaseAdmin
        .from('postulantes')
        .update({ dni })
        .eq('usuario_id', user.id)
      errorPostulante = fallback.error
    }

    if (errorPostulante) {
      if (errorPostulante.code === '23505') {
        return { ok: false, error: 'Ese DNI ya está registrado en otra cuenta' }
      }
      return { ok: false, error: 'No se pudo actualizar los datos del postulante' }
    }

    revalidatePath('/perfil')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error inesperado al actualizar el perfil' }
  }
}

export async function actualizarPerfilLaboral(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'No autenticado' }

    const { data: usuarioRol } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (usuarioRol?.rol !== 'postulante') return { ok: false, error: 'Acción no disponible para tu tipo de cuenta' }

    const estudios = (formData.get('estudios') as string | null)?.trim() ?? ''
    const cursos = (formData.get('cursos') as string | null)?.trim() ?? ''
    const experiencia = (formData.get('experiencia') as string | null)?.trim() ?? ''
    const idiomas = (formData.get('idiomas') as string | null)?.trim() ?? ''
    const habilidades = (formData.get('habilidades') as string | null)?.trim() ?? ''
    const horarios = (formData.get('horarios') as string | null)?.trim() ?? ''

    const { error: errorPostulante } = await supabaseAdmin
      .from('postulantes')
      .update({
        estudios,
        cursos,
        experiencia,
        idiomas,
        habilidades,
        horarios,
      })
      .eq('usuario_id', user.id)

    if (errorPostulante) {
      return {
        ok: false,
        error: errorPostulante.message.includes('column')
          ? 'Para guardar el perfil laboral, ejecutá la migración 010 en el Editor SQL de Supabase.'
          : 'No se pudo actualizar el perfil laboral',
      }
    }

    revalidatePath('/perfil')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error inesperado al actualizar el perfil laboral' }
  }
}

export async function subirCv(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'No autenticado' }

    const { data: usuarioRol } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (usuarioRol?.rol !== 'postulante') return { ok: false, error: 'Acción no disponible para tu tipo de cuenta' }

    const { data: postulante } = await supabase
      .from('postulantes')
      .select('id, cv_url')
      .eq('usuario_id', user.id)
      .single()

    if (!postulante) return { ok: false, error: 'Perfil de postulante no encontrado' }

    // Verificar cuántos CVs tiene en la tabla curricula
    const { data: listaCvs } = await supabaseAdmin
      .from('curricula')
      .select('id')
      .eq('postulante_id', postulante.id)

    const totalCvs = (listaCvs?.length || 0) + (postulante.cv_url && !listaCvs?.length ? 1 : 0)
    if (totalCvs >= 3) {
      return { ok: false, error: 'Podés tener un máximo de 3 currículums. Eliminá uno para subir otro.' }
    }

    const archivo = formData.get('cv') as File | null
    if (!archivo || archivo.size === 0) return { ok: false, error: 'Seleccioná un archivo' }
    if (archivo.size > CV_MAX_BYTES) return { ok: false, error: 'El archivo no puede superar 20 MB' }

    const ext = archivo.name.split('.').pop()?.toLowerCase() ?? ''
    if (!CV_ALLOWED_TYPES.has(archivo.type) || !CV_ALLOWED_EXTS.has(ext)) {
      return { ok: false, error: 'Solo se aceptan archivos PDF, DOC o DOCX' }
    }

    // Paso 1: subir nuevo archivo a storage
    const nombreOriginal = archivo.name
    const nuevoPath = `${user.id}/${Date.now()}-${nombreSeguro(nombreOriginal)}.${ext}`
    const bytes = await archivo.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
      .from(CV_BUCKET)
      .upload(nuevoPath, bytes, { contentType: archivo.type, upsert: false })

    if (uploadError) return { ok: false, error: 'No se pudo subir el archivo. Intentá de nuevo.' }

    // Paso 2: si el postulante tenía un CV viejo en postulantes.cv_url y aún no está en la tabla curricula, migrarlo primero
    if (postulante.cv_url) {
      const nombreLegacy = datosCv(postulante.cv_url).nombre
      await supabaseAdmin.from('curricula').insert({
        postulante_id: postulante.id,
        url: postulante.cv_url,
        nombre: nombreLegacy,
      })
      // Limpiar cv_url viejo ya migrado a la tabla curricula
      await supabase.from('postulantes').update({ cv_url: null }).eq('id', postulante.id)
    }

    // Paso 3: registrar el nuevo CV en la tabla curricula
    const { error: insertError } = await supabaseAdmin
      .from('curricula')
      .insert({
        postulante_id: postulante.id,
        url: nuevoPath,
        nombre: nombreOriginal,
      })

    if (insertError) {
      console.error('Error insertando en tabla curricula:', insertError)
      // Fallback si la migración de la tabla curricula aún no se aplicó
      const { error: fallbackUpdateError } = await supabase
        .from('postulantes')
        .update({ cv_url: nuevoPath })
        .eq('usuario_id', user.id)

      if (fallbackUpdateError) {
        await supabaseAdmin.storage.from(CV_BUCKET).remove([nuevoPath])
        return { ok: false, error: 'No se pudo guardar el CV. Por favor reintentá.' }
      }
    }

    revalidatePath('/perfil')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error inesperado al subir el CV' }
  }
}

export async function eliminarCvById(cvId: string): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'No autenticado' }

    const { data: usuarioRol } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (usuarioRol?.rol !== 'postulante') return { ok: false, error: 'Acción no disponible para tu tipo de cuenta' }

    const { data: postulante } = await supabase
      .from('postulantes')
      .select('id, cv_url')
      .eq('usuario_id', user.id)
      .single()

    if (!postulante) return { ok: false, error: 'Perfil de postulante no encontrado' }

    // Caso A: es de la tabla curricula
    const { data: cvItem } = await supabaseAdmin
      .from('curricula')
      .select('id, url')
      .eq('id', cvId)
      .eq('postulante_id', postulante.id)
      .maybeSingle()

    if (cvItem) {
      await supabaseAdmin.storage.from(CV_BUCKET).remove([cvItem.url])
      await supabaseAdmin.from('curricula').delete().eq('id', cvItem.id)
      revalidatePath('/perfil')
      return { ok: true }
    }

    // Caso B: es el CV legado en postulantes.cv_url
    if (cvId === 'legacy' && postulante.cv_url) {
      await supabaseAdmin.storage.from(CV_BUCKET).remove([postulante.cv_url])
      await supabase.from('postulantes').update({ cv_url: null }).eq('id', postulante.id)
      revalidatePath('/perfil')
      return { ok: true }
    }

    return { ok: false, error: 'CV no encontrado' }
  } catch {
    return { ok: false, error: 'Error inesperado al eliminar el CV' }
  }
}

export async function actualizarEstadoLaboral(
  nuevoEstado: 'en_busqueda' | 'trabajando'
): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'No autenticado' }

    const { data: usuarioRol } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (usuarioRol?.rol !== 'postulante') return { ok: false, error: 'Acción no disponible para tu tipo de cuenta' }

    if (!['en_busqueda', 'trabajando'].includes(nuevoEstado)) {
      return { ok: false, error: 'Estado laboral inválido' }
    }

    // Respaldar siempre en Auth Metadata para garantizar persistencia y disponibilidad inmediata
    try {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          estado_laboral: nuevoEstado,
        },
      })
    } catch (authErr) {
      console.error('Error al actualizar metadata de auth:', authErr)
    }

    const { error } = await supabaseAdmin
      .from('postulantes')
      .update({ estado_laboral: nuevoEstado })
      .eq('usuario_id', user.id)

    // Si la migración aún no se corrió en Supabase, el valor ya quedó seguro en user_metadata
    if (error && !error.message?.includes('column') && error.code !== '42703' && error.code !== 'PGRST204') {
      return { ok: false, error: 'No se pudo actualizar el estado laboral en la base de datos' }
    }

    revalidatePath('/perfil')
    revalidatePath('/inicio')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error inesperado al actualizar el estado laboral' }
  }
}

export async function eliminarCv(): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'No autenticado' }

    const { data: usuarioRol } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
    if (usuarioRol?.rol !== 'postulante') return { ok: false, error: 'Acción no disponible para tu tipo de cuenta' }

    const { data: postulante } = await supabase
      .from('postulantes')
      .select('cv_url')
      .eq('usuario_id', user.id)
      .single()

    if (!postulante?.cv_url) return { ok: false, error: 'No hay CV cargado para eliminar' }

    const { error: storageError } = await supabaseAdmin.storage
      .from(CV_BUCKET)
      .remove([postulante.cv_url])

    if (storageError) return { ok: false, error: 'No se pudo eliminar el archivo del almacenamiento' }

    const { error: updateError } = await supabase
      .from('postulantes')
      .update({ cv_url: null })
      .eq('usuario_id', user.id)

    if (updateError) {
      return { ok: false, error: 'El archivo fue eliminado pero no se pudo actualizar el perfil' }
    }

    revalidatePath('/perfil')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Error inesperado al eliminar el CV' }
  }
}
