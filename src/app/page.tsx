import Image from 'next/image'
import Link from 'next/link'
import escudoFunes from '@/assets/brand/escudo-funes-blanco.png'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { OfertasCarousel, type OfertaSlide } from '@/components/home/ofertas-carousel'
import { FunesCiudadCarousel } from '@/components/home/funes-ciudad-carousel'
import {
  UserCheck,
  Building2,
  ArrowRight,
  Briefcase,
  Search,
  LogIn,
  UserPlus,
  Landmark,
  GraduationCap,
  Award,
  FileText,
  CheckCircle2,
  MapPin,
} from 'lucide-react'

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
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90 group" title="Ir al inicio">
            <Image
              src={escudoFunes}
              alt="Escudo de Funes"
              width={40}
              height={40}
              priority
              className="size-9 shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-sidebar-foreground group-hover:text-emerald-300 transition-colors">
                Municipalidad de Funes
              </span>
              <span className="text-xs text-sidebar-muted">Portal Público de Empleo</span>
            </div>
          </Link>

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
            <Link
              href="/auth/registro"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-700/90 hover:bg-emerald-600 text-white px-3.5 sm:px-4 py-2 rounded-xl transition-all border border-emerald-500/40 shadow-sm hover:scale-[1.02]"
            >
              <UserPlus className="size-3.5 text-emerald-200" />
              <span>Registrarse</span>
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

        {/* Elementos e íconos flotantes traslúcidos en el fondo */}
        <div aria-hidden className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute -top-10 left-[35%] -translate-x-1/2 opacity-[0.06] animate-float-1">
            <Image
              src={escudoFunes}
              alt=""
              width={260}
              height={260}
              priority={false}
              className="size-52 sm:size-64 object-contain brightness-200"
            />
          </div>

          <div className="absolute top-10 left-[6%] text-emerald-300/15 animate-float-1">
            <Briefcase className="size-16 sm:size-20" strokeWidth={1.4} />
          </div>

          <div className="absolute top-[48%] left-[3%] text-white/10 animate-float-2">
            <Landmark className="size-14 sm:size-18" strokeWidth={1.4} />
          </div>

          <div className="absolute bottom-8 left-[24%] text-emerald-200/10 animate-float-3">
            <Building2 className="size-16 sm:size-20" strokeWidth={1.4} />
          </div>

          <div className="absolute top-8 left-[48%] text-white/10 animate-float-4">
            <FileText className="size-12 sm:size-14" strokeWidth={1.4} />
          </div>

          <div className="absolute bottom-6 left-[46%] text-emerald-300/15 animate-float-2">
            <GraduationCap className="size-14 sm:size-16" strokeWidth={1.4} />
          </div>

          <div className="absolute top-8 right-[7%] text-emerald-200/10 animate-float-3">
            <Award className="size-16 sm:size-20" strokeWidth={1.4} />
          </div>

          <div className="absolute bottom-10 right-[10%] text-white/10 animate-float-1">
            <MapPin className="size-12 sm:size-16" strokeWidth={1.4} />
          </div>

          <div className="absolute top-[48%] right-[2%] text-emerald-300/10 animate-float-4">
            <CheckCircle2 className="size-14 sm:size-16" strokeWidth={1.4} />
          </div>
        </div>

        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-36 size-96 rounded-full border border-white/5 opacity-50" />
      </section>

      {/* Sección Selección de Registro / Tipos de Cuenta - Distribuida a lo ancho */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20 w-full flex-1 space-y-16">
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Registro en el Portal
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 tracking-tight">
              Elegí cómo querés participar
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Seleccioná tu perfil para registrarte y acceder a las herramientas correspondientes.
            </p>
          </div>

          {/* Las 2 Tarjetas de Perfil con ancho completo y balanceado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">
            {/* 1. Postulante */}
            <div className="bg-white rounded-3xl border border-gray-200/90 p-8 sm:p-10 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <UserCheck className="size-7" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-100">
                    Búsqueda laboral
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    Soy Postulante
                  </h3>
                  <p className="text-sm font-semibold text-emerald-700 mt-1">Busco empleo o nuevas oportunidades</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Cargá tu currículum vitae, postulate con un solo clic a las vacantes publicadas de la ciudad y hacé seguimiento en vivo del estado de tus derivaciones con el equipo municipal.
                </p>

                <div className="pt-2 space-y-2 text-xs text-gray-500 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Hasta 3 currículums especializados por perfil</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Notificaciones directas de entrevistas acordadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Acompañamiento y capacitaciones de empleo</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-6 border-t border-gray-100">
                <Link
                  href="/auth/registro/postulante"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg hover:scale-[1.01]"
                >
                  <span>Registrarme como postulante</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* 2. Empresa */}
            <div className="bg-white rounded-3xl border border-gray-200/90 p-8 sm:p-10 shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all flex flex-col justify-between group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="size-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <Building2 className="size-7" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50/80 px-2.5 py-1 rounded-full border border-teal-100">
                    Contrataciones
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                    Soy Empresa
                  </h3>
                  <p className="text-sm font-semibold text-teal-700 mt-1">Comercio, PyME o profesional local</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Publicá búsquedas laborales para tu negocio, recibí postulantes preseleccionados y filtrados por el equipo municipal, y gestioná el proceso de contratación en tu propio panel exclusivo.
                </p>

                <div className="pt-2 space-y-2 text-xs text-gray-500 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                    <span>Publicación y difusión de ofertas sin costo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                    <span>Preselección de candidatos idóneos por la Oficina de Empleo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                    <span>Panel privado de gestión de candidatos y derivaciones</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-6 border-t border-gray-100">
                <Link
                  href="/auth/registro/empresa"
                  className="w-full inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg hover:scale-[1.01]"
                >
                  <span>Registrar mi empresa</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Carrusel Ciudad de Funes e Instagram Oficial - Ocupando el contenedor completo */}
        <div className="w-full">
          <FunesCiudadCarousel />
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
