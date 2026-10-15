'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function actualizarPerfilEmpresa(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { ok: false, error: 'No autorizado' }

    // Verificar que es empresa
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (usuario?.rol !== 'empresa') {
      return { ok: false, error: 'No autorizado' }
    }

    // Obtener datos actuales de la empresa
    const { data: empresaActual } = await supabase
      .from('empresas')
      .select('id, razon_social, cuit, estado_aprobacion')
      .eq('usuario_id', user.id)
      .single()

    if (!empresaActual) {
      return { ok: false, error: 'No se encontró el perfil de empresa' }
    }

    // Leer nuevos valores del formulario
    const razon_social = (formData.get('razon_social') as string)?.trim()
    const cuit = (formData.get('cuit') as string)?.trim()
    const rubro = (formData.get('rubro') as string)?.trim()
    const descripcion = (formData.get('descripcion') as string)?.trim() || null
    const email = (formData.get('email') as string)?.trim()
    const nombre = (formData.get('nombre') as string)?.trim()
    const apellido = (formData.get('apellido') as string)?.trim()
    const telefono = (formData.get('telefono') as string)?.trim()

    // Determinar si cambió algún campo sensible
    const cambioCritico =
      razon_social !== empresaActual.razon_social || cuit !== empresaActual.cuit

    // Si hay cambio crítico → volver a pendiente
    const nuevoEstado = cambioCritico ? 'pendiente' : empresaActual.estado_aprobacion

    // Actualizar tabla empresas
    const { error: errorEmpresa } = await supabaseAdmin
      .from('empresas')
      .update({
        razon_social,
        cuit,
        rubro,
        descripcion,
        email,
        estado_aprobacion: nuevoEstado,
      })
      .eq('id', empresaActual.id)

    if (errorEmpresa) {
      if (errorEmpresa.code === '23505') {
        return { ok: false, error: 'Ya existe una empresa registrada con ese CUIT' }
      }
      return { ok: false, error: `Error al guardar: ${errorEmpresa.message}` }
    }

    // Actualizar tabla usuarios (nombre, apellido, teléfono)
    const { error: errorUsuario } = await supabaseAdmin
      .from('usuarios')
      .update({ nombre, apellido, telefono })
      .eq('id', user.id)

    if (errorUsuario) {
      return { ok: false, error: `Error al guardar datos personales: ${errorUsuario.message}` }
    }

    revalidatePath('/empresa/perfil')
    revalidatePath('/empresa')

    return {
      ok: true,
      vueltoPendiente: cambioCritico,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { ok: false, error: msg }
  }
}
