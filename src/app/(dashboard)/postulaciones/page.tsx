import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { FileText, Building2, Calendar, Clock, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ESTADOS_INFO: Record<string, { label: string; badgeClass: string; icon: typeof Clock; desc: string }> = {
  recibida: {
    label: 'Recibida',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
    desc: 'Tu postulación fue registrada y está a la espera de ser evaluada por la Oficina de Empleo Municipal.',
  },
  en_revision: {
    label: 'En revisión',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    desc: 'El equipo municipal está analizando tu perfil y currículum vitae para este puesto.',
  },
  derivada: {
    label: 'Derivada a la empresa',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: CheckCircle2,
    desc: '¡Buenas noticias! La municipalidad envió tu perfil a la empresa contratante para su consideración.',
  },
  rechazada_municipalidad: {
    label: 'No seleccionada',
    badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: XCircle,
    desc: 'La búsqueda continuó con otros perfiles que se adecuaban más a los requisitos específicos solicitados.',
  },
}

export default async function MisPostulacionesPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 1. Validar que sea un postulante
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'postulante') {
    redirect('/inicio')
  }

  // 2. Obtener el ID de postulante
  const { data: postulante } = await supabase
    .from('postulantes')
    .select('id')
    .eq('usuario_id', user.id)
    .single()

  if (!postulante) {
    redirect('/perfil')
  }

  // 3. Consultar las postulaciones del postulante con los datos de cada oferta
  const { data: postulacionesRaw } = await supabase
    .from('postulaciones')
    .select(`
      id,
      estado,
      created_at,
      oferta:ofertas (
        id,
        titulo,
        empresa_nombre,
        descripcion,
        estado
      )
    `)
    .eq('postulante_id', postulante.id)
    .order('created_at', { ascending: false })

  const postulaciones = postulacionesRaw ?? []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mis Postulaciones</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Hacé el seguimiento del estado de las ofertas laborales a las que te postulaste.
        </p>
      </div>

      {postulaciones.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <FileText className="size-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-900">Todavía no tenés postulaciones</h2>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Explorá las vacantes laborales activas en la ciudad y postulate para encontrar tu próximo empleo.
          </p>
          <div className="mt-6">
            <Link
              href="/ofertas"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
            >
              <span>Explorar ofertas laborales</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {postulaciones.map((p) => {
            const oferta = Array.isArray(p.oferta) ? p.oferta[0] : p.oferta
            const estadoCfg = ESTADOS_INFO[p.estado] ?? {
              label: p.estado,
              badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
              icon: Clock,
              desc: '',
            }
            const StatusIcon = estadoCfg.icon

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-lg font-bold text-gray-900">
                        {oferta?.titulo ?? 'Puesto laboral'}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoCfg.badgeClass}`}
                      >
                        <StatusIcon className="size-3.5" />
                        <span>{estadoCfg.label}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5 font-medium text-teal-700">
                        <Building2 className="size-3.5" />
                        {oferta?.empresa_nombre ?? 'Empresa local'}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Calendar className="size-3.5" />
                        Postulado el {new Date(p.created_at).toLocaleDateString('es-AR')}
                      </span>
                    </div>

                    {estadoCfg.desc && (
                      <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-3 leading-relaxed mt-2">
                        {estadoCfg.desc}
                      </p>
                    )}
                  </div>

                  {oferta?.id && (
                    <div className="pt-2 sm:pt-0 shrink-0">
                      <Link
                        href={`/ofertas/${oferta.id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <span>Ver oferta</span>
                        <ArrowUpRight className="size-3.5 text-gray-400" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
