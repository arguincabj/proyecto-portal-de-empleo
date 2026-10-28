'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const AVATAR_BUCKET = 'avatars'

export async function subirFotoPerfil(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'Debés iniciar sesión para realizar esta acción.' }
    }

    const archivo = formData.get('foto') as File | null
    if (!archivo || !(archivo instanceof File)) {
      return { ok: false, error: 'No se recibió ninguna imagen válida.' }
    }

    // Validación de tipo y tamaño (máximo 5MB)
    const mimeTypesValidos = ['image/jpeg', 'image/png', 'image/webp']
    if (!mimeTypesValidos.includes(archivo.type)) {
      return { ok: false, error: 'Formato inválido. Usá JPG, PNG o WebP.' }
    }

    if (archivo.size > 5 * 1024 * 1024) {
      return { ok: false, error: 'La imagen no puede superar los 5 MB.' }
    }

    const arrayBuffer = await archivo.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Limpiar avatares anteriores del usuario en el bucket
    try {
      const { data: archivosExistentes } = await supabaseAdmin.storage
        .from(AVATAR_BUCKET)
        .list(user.id)

      if (archivosExistentes && archivosExistentes.length > 0) {
        const pathsParaEliminar = archivosExistentes.map((f) => `${user.id}/${f.name}`)
        await supabaseAdmin.storage.from(AVATAR_BUCKET).remove(pathsParaEliminar)
      }
    } catch {
      // Ignorar error al limpiar anteriores
    }

    // Subir la nueva imagen con timestamp
    const ext = archivo.type === 'image/png' ? 'png' : archivo.type === 'image/webp' ? 'webp' : 'jpg'
    const fileName = `${user.id}/avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(fileName, buffer, {
        contentType: archivo.type,
        upsert: true,
      })

    if (uploadError) {
      return { ok: false, error: `Error al subir la imagen: ${uploadError.message}` }
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(fileName)

    // Guardar en user_metadata de auth.users
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        avatar_url: publicUrl,
      },
    })

    // Intentar guardar en la tabla usuarios si la columna existe
    try {
      await supabaseAdmin.from('usuarios').update({ avatar_url: publicUrl }).eq('id', user.id)
    } catch {
      // Si la columna no fue migrada aún, user_metadata ya persiste el valor
    }

    revalidatePath('/perfil')
    revalidatePath('/empresa/perfil')
    revalidatePath('/admin/perfil')
    revalidatePath('/inicio')
    revalidatePath('/')

    return { ok: true, avatarUrl: publicUrl }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al procesar la foto'
    return { ok: false, error: msg }
  }
}

export async function eliminarFotoPerfil() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'No autenticado.' }
    }

    // Eliminar del almacenamiento
    try {
      const { data: archivosExistentes } = await supabaseAdmin.storage
        .from(AVATAR_BUCKET)
        .list(user.id)

      if (archivosExistentes && archivosExistentes.length > 0) {
        const pathsParaEliminar = archivosExistentes.map((f) => `${user.id}/${f.name}`)
        await supabaseAdmin.storage.from(AVATAR_BUCKET).remove(pathsParaEliminar)
      }
    } catch {
      // Ignorar si no hay archivos
    }

    // Quitar de user_metadata
    const updatedMetadata = { ...(user.user_metadata || {}) }
    delete updatedMetadata.avatar_url

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: updatedMetadata,
    })

    // Intentar limpiar en la tabla usuarios si existe
    try {
      await supabaseAdmin.from('usuarios').update({ avatar_url: null }).eq('id', user.id)
    } catch {
      // Ignorar
    }

    revalidatePath('/perfil')
    revalidatePath('/empresa/perfil')
    revalidatePath('/admin/perfil')
    revalidatePath('/inicio')
    revalidatePath('/')

    return { ok: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al eliminar la foto'
    return { ok: false, error: msg }
  }
}
