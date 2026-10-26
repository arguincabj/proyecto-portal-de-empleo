import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const ROL_REDIRECT: Record<string, string> = {
  postulante: '/perfil',
  empresa: '/empresa/perfil',
  municipalidad: '/admin/perfil',
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')

  const supabase = await createSupabaseServerClient()
  let authExitoso = false
  let userId: string | null = null

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      authExitoso = true
      userId = data.session.user.id
    }
  } else if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error && data.session) {
      authExitoso = true
      userId = data.session.user.id
    }
  }

  if (authExitoso) {
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/auth/nueva-contrasena', origin))
    }

    // Si se especificó un destino explícito, usarlo
    if (next) {
      return NextResponse.redirect(new URL(next, origin))
    }

    // Sin destino explícito: redirigir al perfil según el rol del usuario recién confirmado
    if (userId) {
      const { data: usuario } = await supabaseAdmin
        .from('usuarios')
        .select('rol')
        .eq('id', userId)
        .single()

      const destino = (usuario?.rol && ROL_REDIRECT[usuario.rol]) ?? '/inicio'
      return NextResponse.redirect(new URL(destino, origin))
    }

    return NextResponse.redirect(new URL('/inicio', origin))
  }

  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/auth/recuperar-contrasena?error=invalid_token', origin))
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth_callback_error', origin))
}
