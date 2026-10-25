import { NextRequest, NextResponse } from 'next/server'
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
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/nueva-contrasena', origin))
      }

      // Si se especificó un destino explícito (recovery u otro flow), usarlo
      if (next) {
        return NextResponse.redirect(new URL(next, origin))
      }

      // Sin destino explícito: redirigir al perfil según el rol del usuario recién confirmado
      if (sessionData?.user) {
        const userId = sessionData.user.id
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
  }

  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/auth/recuperar-contrasena?error=invalid_token', origin))
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth_callback_error', origin))
}
