'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { esSuperAdmin } from '@/lib/superadmin'

async function verificarSuperAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !esSuperAdmin(user)) {
    throw new Error('No autorizado. Se requieren permisos de Super Administrador.')
  }
  return user
}

export type AdminItem = {
  id: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  created_at: string
}

export async function obtenerAdministradores(): Promise<{ ok: boolean; administradores?: AdminItem[]; error?: string }> {
  try {
    await verificarSuperAdmin()

    // 1. Obtener usuarios con rol municipalidad
    const { data: usuarios, error: errUsuarios } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre, apellido, telefono, rol, created_at')
      .eq('rol', 'municipalidad')
      .order('created_at', { ascending: false })

    if (errUsuarios) {
      return { ok: false, error: 'Error al consultar administradores en la base de datos' }
    }

    // 2. Obtener lista de usuarios de Auth para obtener sus emails y filtrar el propio superadmin
    const { data: listUsersData, error: errAuth } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    })

    if (errAuth) {
      return { ok: false, error: 'Error al consultar cuentas de autenticación' }
    }

    const authMap = new Map<string, { email: string; isSuper: boolean }>()
    for (const u of listUsersData.users) {
      const email = u.email ?? ''
      const isSuper =
        email.toLowerCase() === 'supadmin@gmail.com' ||
        u.user_metadata?.is_superadmin === true ||
        u.user_metadata?.rol === 'superadmin'
      authMap.set(u.id, { email, isSuper })
    }

    const administradores: AdminItem[] = []
    for (const adm of usuarios ?? []) {
      const authInfo = authMap.get(adm.id)
      // No mostrar al superadmin como un admin común a eliminar
      if (authInfo?.isSuper) continue

      administradores.push({
        id: adm.id,
        nombre: adm.nombre,
        apellido: adm.apellido,
        telefono: adm.telefono || '',
        email: authInfo?.email || 'Sin correo asociado',
        created_at: adm.created_at,
      })
    }

    return { ok: true, administradores }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al obtener administradores'
    return { ok: false, error: msg }
  }
}

export async function crearAdministrador(data: {
  nombre: string
  apellido: string
  email: string
  password: string
  telefono?: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await verificarSuperAdmin()

    const nombre = data.nombre.trim()
    const apellido = data.apellido.trim()
    const email = data.email.trim().toLowerCase()
    const password = data.password
    const telefono = (data.telefono ?? '').trim()

    if (!nombre || !apellido || !email || !password) {
      return { ok: false, error: 'Completá todos los campos requeridos.' }
    }

    if (password.length < 8) {
      return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' }
    }

    // 1. Crear el usuario en Supabase Auth con email confirmado
    const { data: createdAuth, error: errAuth } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellido,
        telefono,
        rol: 'municipalidad',
      },
    })

    if (errAuth) {
      if (errAuth.message?.includes('already registered') || errAuth.message?.includes('unique')) {
        return { ok: false, error: 'Ya existe un usuario registrado con ese correo electrónico.' }
      }
      return { ok: false, error: `Error al crear usuario en autenticación: ${errAuth.message}` }
    }

    const newUserId = createdAuth.user.id

    // 2. Crear la fila correspondiente en la tabla usuarios con rol municipalidad
    const { error: errInsert } = await supabaseAdmin.from('usuarios').insert({
      id: newUserId,
      nombre,
      apellido,
      telefono,
      rol: 'municipalidad',
    })

    if (errInsert) {
      // Rollback del usuario en auth
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return { ok: false, error: `Error al registrar datos del perfil: ${errInsert.message}` }
    }

    revalidatePath('/superadmin')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al crear administrador'
    return { ok: false, error: msg }
  }
}

export async function eliminarAdministrador(adminId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const superUser = await verificarSuperAdmin()

    if (adminId === superUser.id) {
      return { ok: false, error: 'No podés eliminar tu propia cuenta de Super Administrador.' }
    }

    // Verificar que el usuario a eliminar no sea otro superadmin
    const { data: targetAuth } = await supabaseAdmin.auth.admin.getUserById(adminId)
    if (targetAuth?.user) {
      const email = targetAuth.user.email?.toLowerCase()
      if (
        email === 'supadmin@gmail.com' ||
        targetAuth.user.user_metadata?.is_superadmin === true ||
        targetAuth.user.user_metadata?.rol === 'superadmin'
      ) {
        return { ok: false, error: 'No está permitido eliminar a un Super Administrador.' }
      }
    }

    // 1. Eliminar de la tabla usuarios (por ON DELETE CASCADE borrará referencias vinculadas si las hubiera)
    await supabaseAdmin.from('usuarios').delete().eq('id', adminId)

    // 2. Eliminar de auth.users
    const { error: errAuthDelete } = await supabaseAdmin.auth.admin.deleteUser(adminId)
    if (errAuthDelete) {
      return { ok: false, error: `Error al eliminar cuenta de autenticación: ${errAuthDelete.message}` }
    }

    revalidatePath('/superadmin')
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al eliminar administrador'
    return { ok: false, error: msg }
  }
}
