import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/inicio'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/nueva-contrasena', origin))
      }
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/auth/recuperar-contrasena?error=invalid_token', origin))
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth_callback_error', origin))
}
