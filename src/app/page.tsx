import Image from 'next/image'
import Link from 'next/link'
import escudoFunes from '@/assets/brand/escudo-funes-blanco.png'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { OfertasCarousel, type OfertaSlide } from '@/components/home/ofertas-carousel'
import { UserCheck, Building2, ArrowRight, Briefcase, Search, LogIn } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Obtener ofertas reales activas/publicadas desde Supabase
  const { data: ofertasRaw } = await supabaseAdmin
    .from('ofertas')
    .select('id, titulo, empresa_nombre, descripcion, created_at')
    .eq('estado', 'publicada')
    .order('created_at', { ascending: false })
    .limit(10)

  const ofertas: OfertaSlide[] = ofertasRaw ?? []

  return (
    <main className="min-h-screen bg-page flex flex-col">
      {/* Barra superior de navegación */}
      <header className="w-full bg-sidebar text-sidebar-foreground border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ofertas"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-sidebar-muted hover:text-white transition-colors px-3 py-2 rounded-lg"
            >
              <Search className="size-3.5" />
              <span>Ver todas las ofertas</span>
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all border border-white/20"
            >
              <LogIn className="size-3.5" />
              <span>Iniciar sesión</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Principal con Carrousel de Ofertas Activas */}
      <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground py-12 sm:py-16 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Texto Izquierdo */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sidebar-hover border border-sidebar-muted/20 text-xs font-medium text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Bolsa Oficial de Empleo Municipal</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Encontrá tu próximo <br />
              <span className="text-emerald-400">trabajo en Funes</span>
            </h1>

            <p className="text-base sm:text-lg text-sidebar-muted max-w-xl leading-relaxed">
              Conectamos a vecinos postulantes con empresas y comercios locales de forma ágil, transparente y con respaldo del municipio.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/auth/registro"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
              >
                <span>Crear cuenta gratis</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/ofertas"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium text-sm px-5 py-3 rounded-xl border border-white/20 transition-colors"
              >
                <Briefcase className="size-4 text-emerald-300" />
                <span>Explorar vacantes ({ofertas.length})</span>
              </Link>
            </div>
          </div>

          {/* Carrusel Interactivo de Ofertas Activas a la Derecha */}
          <div className="lg:col-span-5 w-full">
            <div className="text-xs font-semibold uppercase tracking-wider text-sidebar-muted mb-2 flex items-center justify-between">
              <span>Ofertas laborales activas</span>
              <Link href="/ofertas" className="text-emerald-300 hover:underline">
                Ver catálogo completo →
              </Link>
            </div>
            <OfertasCarousel ofertas={ofertas} />
          </div>
        </div>

        {/* Círculos decorativos institucionales en el fondo */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-36 size-96 rounded-full border border-white/5 opacity-50" />
      </section>

      {/* Sección Selección de Registro / Tipos de Cuenta */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 w-full flex-1">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Registro en el Portal
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-3 tracking-tight">
            Elegí cómo querés participar
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Seleccioná tu perfil para registrarte y acceder a las herramientas correspondientes.
          </p>
        </div>

        {/* Las 2 Tarjetas de Perfil */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* 1. Postulante */}
          <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Soy Postulante</h3>
                <p className="text-xs font-medium text-emerald-700 mt-0.5">Busco empleo o nuevas oportunidades</p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cargá tu currículum vitae, postulate con un solo clic a las vacantes publicadas y hacé seguimiento en vivo de tus derivaciones.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100">
              <Link
                href="/auth/registro/postulante"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-sm"
              >
                <span>Registrarme como postulante</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. Empresa */}
          <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm hover:shadow-md hover:border-teal-500/50 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Soy Empresa</h3>
                <p className="text-xs font-medium text-teal-700 mt-0.5">Comercio, PyME o profesional local</p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Publicá búsquedas laborales, recibí postulantes filtrados por el equipo municipal y gestioná tus selecciones en tu propio panel.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100">
              <Link
                href="/auth/registro/empresa"
                className="w-full inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-sm"
              >
                <span>Registrar mi empresa</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pie de página */}
      <footer className="border-t border-gray-200 bg-white py-6 px-4 text-center text-xs text-gray-500">
        <p>Gobierno de la Ciudad de Funes · Portal de Empleo Municipal</p>
        <p className="text-[11px] text-gray-400 mt-1">Desarrollado con Funes Tech Lab</p>
      </footer>
    </main>
  )
}
