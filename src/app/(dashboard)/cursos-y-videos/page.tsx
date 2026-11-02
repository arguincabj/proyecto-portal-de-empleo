import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, ArrowLeft } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { contarRechazosDePostulante } from '@/lib/verificar-cit'
import { CursosVideosClient } from './cursos-videos-client'

export const dynamic = 'force-dynamic'

export default async function CursosYVideosPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Obtener rol del usuario
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, rol')
    .eq('id', user.id)
    .single()

  let totalRechazados = 0
  let haAlcanzadoTresRechazos = false
  let citAsignado = false

  // Si es postulante, obtener sus métricas de rechazo
  if (!usuario?.rol || usuario.rol === 'postulante') {
    const { data: postulante } = await supabaseAdmin
      .from('postulantes')
      .select('id, cit_asignado')
      .eq('usuario_id', user.id)
      .maybeSingle()

    if (postulante) {
      citAsignado = !!postulante.cit_asignado
      totalRechazados = await contarRechazosDePostulante(postulante.id)
      haAlcanzadoTresRechazos = totalRechazados >= 3 || citAsignado
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs tracking-wider uppercase mb-1">
            <GraduationCap className="size-4" />
            <span>Capacitación y Formación Laboral</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Cursos y Videos
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Herramientas prácticas, talleres presenciales y videos formativos impulsados por la Municipalidad de Funes para ayudarte a preparar tu CV y destacar en entrevistas laborales.
          </p>
        </div>

        <Link
          href="/inicio"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-xs self-start sm:self-auto"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <CursosVideosClient
        haAlcanzadoTresRechazos={haAlcanzadoTresRechazos}
        totalRechazados={totalRechazados}
        citAsignado={citAsignado}
      />
    </div>
  )
}
