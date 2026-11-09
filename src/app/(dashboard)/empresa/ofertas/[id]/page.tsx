import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ArrowLeft, Building2, Calendar, ShieldCheck, Briefcase, Clock, Banknote, Users, Edit3 } from 'lucide-react'
import { formatearSalario } from '@/lib/utils'
import { CambiarEstadoBoton } from '@/app/(dashboard)/empresa/cambiar-estado-boton'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EmpresaOfertaDetallePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  // 1. Validar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 2. Validar rol empresa
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'empresa') {
    redirect('/ofertas/' + id)
  }

  // 3. Obtener la empresa del usuario
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id, razon_social')
    .eq('usuario_id', user.id)
    .single()

  if (!empresa) {
    redirect('/empresa')
  }

  // 4. Obtener la oferta
  const { data: oferta, error: ofertaError } = await supabaseAdmin
    .from('ofertas')
    .select('*')
    .eq('id', id)
    .single()

  if (ofertaError || !oferta) {
    return notFound()
  }

  // 5. Verificar que pertenezca a la empresa
  const esDuenia =
    (oferta.empresa_id && oferta.empresa_id === empresa.id) ||
    oferta.empresa_nombre?.trim().toLowerCase() === empresa.razon_social?.trim().toLowerCase()

  if (!esDuenia) {
    redirect('/ofertas/' + id)
  }

  // 6. Obtener categorías asociadas
  const { data: ofertaCategorias } = await supabaseAdmin
    .from('oferta_categorias')
    .select('categoria:categorias(nombre)')
    .eq('oferta_id', id)

  const categorias = (ofertaCategorias as Array<{ categoria: { nombre: string } | { nombre: string }[] | null }> | null)
    ?.map((item) => {
      const cat = Array.isArray(item.categoria) ? item.categoria[0] : item.categoria
      return cat?.nombre
    })
    .filter((nombre): nombre is string => Boolean(nombre))

  // 7. Contar postulantes derivados
  let cantDerivados = 0
  try {
    const { data: postulaciones } = await supabaseAdmin
      .from('postulaciones')
      .select('id')
      .eq('oferta_id', id)

    if (postulaciones && postulaciones.length > 0) {
      const postIds = postulaciones.map((p) => p.id)
      const { count } = await supabaseAdmin
        .from('derivaciones')
        .select('id', { count: 'exact', head: true })
        .in('postulacion_id', postIds)
      cantDerivados = count ?? 0
    }
  } catch (err) {
    console.error('Error calculando derivados:', err)
  }

  // Fechas y vigencia
  const fechaPublicacion = new Date(oferta.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const duracionDias = oferta.duracion_dias || 30
  const fechaInicioRaw = oferta.fecha_inicio_seleccion || oferta.created_at
  const fechaInicioObj = new Date(fechaInicioRaw)
  const fechaFinObj = oferta.fecha_fin_seleccion
    ? new Date(oferta.fecha_fin_seleccion + 'T23:59:59')
    : new Date(fechaInicioObj.getTime() + duracionDias * 24 * 60 * 60 * 1000)

  const fechaInicioTexto = !isNaN(fechaInicioObj.getTime())
    ? fechaInicioObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : fechaPublicacion

  const fechaFinTexto = !isNaN(fechaFinObj.getTime())
    ? fechaFinObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const hoy = new Date()
  const diasRestantes = Math.ceil((fechaFinObj.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  const convocatoriaAbierta = diasRestantes > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Barra superior de navegación y acciones rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/empresa"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-teal-700 transition-colors bg-white px-3.5 py-2 rounded-xl shadow-xs border border-gray-200"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver al Panel de Empresa</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/empresa/ofertas/${oferta.id}/candidatos`}
            className="text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Users className="size-3.5 text-teal-700" />
            <span>Ver candidatos ({cantDerivados})</span>
          </Link>

          {oferta.estado === 'borrador' && (
            <Link
              href={`/ofertas/${oferta.id}/editar`}
              className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Edit3 className="size-3.5" />
              <span>Corregir oferta</span>
            </Link>
          )}

          <CambiarEstadoBoton ofertaId={oferta.id} estadoActual={oferta.estado} />
        </div>
      </div>

      {/* Observación municipal si fue observada / rechazada a borrador */}
      {oferta.estado === 'borrador' && oferta.motivo_rechazo && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 shadow-xs space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
            <span>⚠️ Observación de la Municipalidad:</span>
          </p>
          <p className="p-3 bg-white/90 rounded-xl border border-amber-200 font-medium leading-relaxed">
            &quot;{oferta.motivo_rechazo}&quot;
          </p>
          <p className="text-amber-700 text-xs">
            Hacé clic en <strong>&quot;Corregir oferta&quot;</strong> para modificar los datos requeridos y reenviarla a revisión municipal.
          </p>
        </div>
      )}

      {/* Encabezado Principal */}
      <section className="rounded-2xl bg-white shadow-xs border border-gray-100 p-6 sm:p-8 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-teal-700">
              <Building2 className="size-4" />
              <span>{oferta.empresa_nombre || empresa.razon_social}</span>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                oferta.estado === 'publicada'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : oferta.estado === 'pendiente'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                  : oferta.estado === 'borrador'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {oferta.estado === 'publicada'
                ? 'Publicada'
                : oferta.estado === 'pendiente'
                ? 'Pendiente de aprobación'
                : oferta.estado === 'borrador'
                ? 'Borrador (requiere correcciones)'
                : oferta.estado === 'cerrada'
                ? 'Cerrada'
                : oferta.estado}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
            {oferta.titulo}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-500 pt-2 border-t border-gray-100 font-mono">
          <span className="flex items-center gap-1.5 font-sans">
            <Calendar className="size-3.5 text-gray-400" />
            Publicada el {fechaPublicacion}
          </span>
          <span className="flex items-center gap-1.5 text-teal-800 font-semibold font-sans bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            <Clock className="size-3.5 text-teal-600" />
            Selección: {duracionDias} días {fechaFinTexto ? `(hasta el ${fechaFinTexto})` : ''}
          </span>
          {oferta.salario ? (
            <span className="flex items-center gap-1.5 text-emerald-800 font-bold font-sans bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <Banknote className="size-3.5 text-emerald-600" />
              Salario: {formatearSalario(oferta.salario)}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-gray-500 font-medium font-sans bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-200">
              <Banknote className="size-3.5 text-gray-400" />
              Salario: A convenir
            </span>
          )}
          <span className="flex items-center gap-1.5 text-teal-700 font-semibold font-sans">
            <Users className="size-3.5" />
            {cantDerivados} {cantDerivados === 1 ? 'postulante derivado' : 'postulantes derivados'}
          </span>
          <span className="flex items-center gap-1.5 text-gray-500 font-sans">
            <ShieldCheck className="size-3.5 text-teal-600" />
            Portal Municipal de Empleo de Funes
          </span>
        </div>

        {/* Banner informativo del período de selección */}
        <div className="rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50/60 border border-teal-200/80 p-4 text-xs text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-teal-800">
                Proceso de Selección Laboral
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  convocatoriaAbierta
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {convocatoriaAbierta
                  ? `${diasRestantes} ${diasRestantes === 1 ? 'día restante' : 'días restantes'}`
                  : 'Convocatoria cumplida'}
              </span>
            </div>
            <p className="text-gray-700">
              <strong>Comienzo de selección:</strong> {fechaInicioTexto} &nbsp;·&nbsp;
              <strong>Duración de convocatoria:</strong> {duracionDias} días corridos.
            </p>
          </div>
          {fechaFinTexto && (
            <div className="shrink-0 text-left sm:text-right">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">Cierre estimado</span>
              <span className="font-mono font-bold text-teal-900">{fechaFinTexto}</span>
            </div>
          )}
        </div>

        {/* Categorías */}
        {categorias && categorias.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {categorias.map((cat, idx) => (
              <span
                key={idx}
                className="bg-teal-50 text-teal-800 text-xs px-3 py-1 rounded-lg font-medium border border-teal-100"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Detalle y Requisitos */}
      <section className="rounded-2xl bg-white shadow-xs border border-gray-100 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Briefcase className="size-5 text-teal-600" />
          <h2>Descripción del Puesto</h2>
        </div>
        <div className="text-gray-700 whitespace-pre-line leading-relaxed text-sm sm:text-base">
          {oferta.descripcion}
        </div>
      </section>

      {/* Acceso a candidatos derivados para esta búsqueda */}
      <section className="rounded-2xl bg-teal-900 text-white p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">Candidatos derivados por la Municipalidad</h3>
          <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
            Revisá los perfiles laborales, currículums vitae y datos de contacto de las personas recomendadas para este puesto.
          </p>
        </div>
        <Link
          href={`/empresa/ofertas/${oferta.id}/candidatos`}
          className="shrink-0 bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-colors inline-flex items-center gap-2"
        >
          <Users className="size-4" />
          <span>Administrar candidatos ({cantDerivados})</span>
        </Link>
      </section>
    </div>
  )
}
