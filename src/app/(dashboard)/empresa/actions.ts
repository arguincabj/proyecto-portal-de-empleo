'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function crearOfertaEmpresa(data: {
  titulo: string
  descripcion: string
  categoriaId?: string
  modalidad?: string
  estado?: 'publicada' | 'pendiente'
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
      .select('id, razon_social')
      .eq('usuario_id', user.id)
      .single()

    if (empresaError || !empresa) {
      return { ok: false, error: 'No se encontró el perfil de tu empresa.' }
    }

    // Preparar descripción integrando la modalidad si se especificó
    let descripcionFinal = data.descripcion.trim()
    if (data.modalidad && data.modalidad !== 'no_especificada') {
      const modalidadTexto = `\n\nModalidad: ${data.modalidad.charAt(0).toUpperCase() + data.modalidad.slice(1)}`
      if (!descripcionFinal.toLowerCase().includes('modalidad:')) {
        descripcionFinal += modalidadTexto
      }
    }

    // 2. Insertar la oferta
    const { data: nuevaOferta, error: ofertaError } = await supabaseAdmin
      .from('ofertas')
      .insert({
        empresa_nombre: empresa.razon_social,
        titulo: data.titulo.trim(),
        descripcion: descripcionFinal,
        estado: data.estado ?? 'publicada',
      })
      .select('id')
      .single()

    if (ofertaError || !nuevaOferta) {
      return { ok: false, error: `Error al guardar la oferta: ${ofertaError?.message}` }
    }

    // 3. Vincular categoría si fue seleccionada
    if (data.categoriaId) {
      await supabaseAdmin.from('oferta_categorias').insert({
        oferta_id: nuevaOferta.id,
        categoria_id: data.categoriaId,
      })
    }

    revalidatePath('/empresa')
    revalidatePath('/ofertas')
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

    const { error } = await supabaseAdmin
      .from('derivaciones')
      .update({
        estado_empresa: estadoEmpresa,
        nota_empresa: notaEmpresa ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', derivacionId)

    if (error) return { ok: false, error: error.message }

    revalidatePath('/empresa')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar la derivación'
    return { ok: false, error: msg }
  }
}
