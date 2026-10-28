import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import Image from 'next/image'
import Link from 'next/link'
import escudoFunes from '@/assets/brand/escudo-funes-blanco.png'
import { LogIn, UserPlus } from 'lucide-react'

export default async function OfertasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let usuario: { nombre: string; apellido: string; rol: string } | null = null

  if (user) {
    const { data } = await supabase
      .from('usuarios')
      .select('nombre, apellido, rol')
      .eq('id', user.id)
      .maybeSingle()

    usuario = data

    if (!usuario) {
      const { data: adminU } = await supabaseAdmin
        .from('usuarios')
        .select('nombre, apellido, rol')
        .eq('id', user.id)
        .maybeSingle()
      usuario = adminU
    }
  }

  // Si el usuario está autenticado, mostramos el layout completo del dashboard con la barra lateral
  if (usuario) {
    return (
      <div className="flex h-dvh flex-col bg-page lg:flex-row">
        <MobileSidebar usuario={usuario} />
        <Sidebar usuario={usuario} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    )
  }

  // Si el usuario no ha iniciado sesión, mostramos el encabezado institucional público armonizado
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <header className="w-full bg-sidebar text-sidebar-foreground border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={escudoFunes}
              alt="Escudo de Funes"
              width={40}
              height={40}
              priority
              className="size-9 shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-sidebar-foreground">
                Municipalidad de Funes
              </span>
              <span className="text-xs text-sidebar-muted">Portal Público de Empleo</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all border border-white/20"
            >
              <LogIn className="size-3.5" />
              <span>Iniciar sesión</span>
            </Link>
            <Link
              href="/auth/registro"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <UserPlus className="size-3.5" />
              <span>Registrarse</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
