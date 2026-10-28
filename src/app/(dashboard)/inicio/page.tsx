import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { UserRound, Briefcase, Send, ArrowRight, GraduationCap } from 'lucide-react'

const ROL_LABEL: Record<string, string> = {
  postulante: 'Postulante',
  empresa: 'Empresa',
  municipalidad: 'Municipalidad',
}

export default async function InicioPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido, rol')
    .eq('id', user.id)
    .single()

  if (!usuario) {
    const { data: adminUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('nombre, apellido, rol')
      .eq('id', user.id)
      .single()
    usuario = adminUsuario
  }

  if (usuario?.rol === 'empresa') {
    redirect('/empresa')
  }

  if (usuario?.rol === 'municipalidad') {
    redirect('/admin')
  }

  const nombreCompleto = usuario?.nombre
    ? `${usuario.nombre} ${usuario.apellido}`.trim()
    : 'Postulante'

  let estadoLaboral: 'en_busqueda' | 'trabajando' = 'en_busqueda'
  let citAsignado = false
  let citEstado: string | null = null

  if (!usuario?.rol || usuario.rol === 'postulante') {
    const { data: postulante } = await supabaseAdmin
      .from('postulantes')
      .select('estado_laboral, cit_asignado, cit_estado')
      .eq('usuario_id', user.id)
      .maybeSingle()

    const meta = user.user_metadata || {}
    const estado = postulante?.estado_laboral || meta.estado_laboral
    if (estado === 'trabajando') {
      estadoLaboral = 'trabajando'
    }
    if (postulante?.cit_asignado) {
      citAsignado = true
      citEstado = postulante.cit_estado || 'pendiente'
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-surface p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-foreground">
          Bienvenido, {nombreCompleto}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-600">
            {ROL_LABEL[usuario?.rol ?? 'postulante'] ?? 'Postulante'}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              estadoLaboral === 'trabajando'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span>{estadoLaboral === 'trabajando' ? '🔵' : '🟢'}</span>
            <span>
              {estadoLaboral === 'trabajando'
                ? 'Actualmente trabajando'
                : 'En búsqueda laboral'}
            </span>
          </span>
        </div>
        <p className="mt-4 text-sm text-foreground-secondary">
          Gestioná tu perfil laboral, postulate a ofertas y hacé seguimiento de tus postulaciones en el Portal de Empleo.
        </p>
      </div>

      {citAsignado && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <GraduationCap className="size-5" />
              </span>
              <h3 className="font-bold text-amber-950 text-base">
                Convocatoria a Curso de Introducción al Trabajo (CIT)
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300">
                Oficina Municipal de Empleo
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed max-w-3xl pt-1">
              Al no haber superado 3 entrevistas laborales, la Municipalidad te ha derivado al <strong>Curso de Introducción al Trabajo</strong> para fortalecer tu perfil, tus técnicas de entrevista y tus competencias para acceder a un empleo de calidad.
            </p>
          </div>
          <div className="shrink-0 self-end sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white shadow-xs">
              Estado: {citEstado === 'en_curso' ? 'En curso' : citEstado === 'completado' ? 'Completado' : 'Asignado'}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/perfil"
          className="group rounded-xl bg-surface p-5 shadow-card transition-all hover:shadow-md hover:border-primary-500/30 border border-transparent flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 group-hover:scale-105 transition-transform">
                <UserRound className="size-5" />
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  estadoLaboral === 'trabajando'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                <span>{estadoLaboral === 'trabajando' ? '🔵 Trabajando' : '🟢 En búsqueda'}</span>
              </span>
            </div>
            <h2 className="text-base font-semibold text-foreground">Mi Perfil</h2>
            <p className="mt-1 text-xs text-foreground-secondary leading-relaxed">
              Cargá tus datos personales, tu perfil laboral (estudios, experiencia, cursos, idiomas, horarios) y tu CV.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary-600">
            Completar perfil <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/ofertas"
          className="group rounded-xl bg-surface p-5 shadow-card transition-all hover:shadow-md hover:border-primary-500/30 border border-transparent flex flex-col justify-between"
        >
          <div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-3 group-hover:scale-105 transition-transform">
              <Briefcase className="size-5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Ofertas</h2>
            <p className="mt-1 text-xs text-foreground-secondary leading-relaxed">
              Explorá las vacantes de trabajo disponibles publicadas por empresas y comercios de Funes.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            Ver ofertas <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/postulaciones"
          className="group rounded-xl bg-surface p-5 shadow-card transition-all hover:shadow-md hover:border-primary-500/30 border border-transparent flex flex-col justify-between"
        >
          <div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-3 group-hover:scale-105 transition-transform">
              <Send className="size-5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Mis Postulaciones</h2>
            <p className="mt-1 text-xs text-foreground-secondary leading-relaxed">
              Hacé seguimiento del estado de tus postulaciones y derivaciones en tiempo real.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
            Ver postulaciones <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </div>
  )
}
