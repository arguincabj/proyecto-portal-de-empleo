import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { BotonPostular } from './boton-postular'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OfertaDetallePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  // 1. Obtener la oferta
  const { data: oferta, error: ofertaError } = await supabase
    .from('ofertas')
    .select('id, empresa_nombre, titulo, descripcion, estado, created_at')
    .eq('id', id)
    .single()

  if (ofertaError || !oferta) {
    return notFound()
  }

  // 2. Obtener categorías asociadas
  const { data: ofertaCategorias } = await supabase
    .from('oferta_categorias')
    .select('categoria:categorias(nombre)')
    .eq('oferta_id', id)

  const categorias = ofertaCategorias
    ?.map((item: any) => {
      const cat = Array.isArray(item.categoria) ? item.categoria[0] : item.categoria
      return cat?.nombre
    })
    .filter((nombre): nombre is string => Boolean(nombre))

  // 3. Verificar estado de autenticación y postulación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole: string | null = null
  let yaPostulado = false
  let estadoPostulacion: string | null = null

  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    userRole = usuario?.rol ?? null

    if (userRole === 'postulante') {
      const { data: postulante } = await supabase
        .from('postulantes')
        .select('id')
        .eq('usuario_id', user.id)
        .single()

      if (postulante) {
        const { data: postu } = await supabase
          .from('postulaciones')
          .select('estado')
          .eq('oferta_id', id)
          .eq('postulante_id', postulante.id)
          .maybeSingle()

        if (postu) {
          yaPostulado = true
          estadoPostulacion = postu.estado
        }
      }
    }
  }

  const fechaPublicacion = new Date(oferta.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navegación / Volver */}
        <div>
          <Link
            href="/ofertas"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 transition-colors font-medium"
          >
            <span>←</span> Volver a todas las ofertas
          </Link>
        </div>

        {/* Encabezado Principal */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-teal-700">
                {oferta.empresa_nombre}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {oferta.titulo}
              </h1>
            </div>

            <span className="inline-flex items-center text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-800 border border-green-200 capitalize">
              {oferta.estado}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-gray-500 pt-2 border-t border-gray-100">
            <span>📅 Publicada el {fechaPublicacion}</span>
            <span>🏛️ Portal Municipal de Empleo</span>
          </div>

          {/* Categorías */}
          {categorias && categorias.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {categorias.map((cat, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-lg font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Detalle y Requisitos */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Descripción del Puesto</h2>
          <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-line leading-relaxed text-sm sm:text-base">
            {oferta.descripcion}
          </div>
        </section>

        {/* Sección de Postulación */}
        <section>
          <BotonPostular
            ofertaId={oferta.id}
            isAuthenticated={!!user}
            userRole={userRole}
            yaPostulado={yaPostulado}
            estadoPostulacion={estadoPostulacion}
          />
        </section>

        {/* Información Adicional Municipal */}
        <footer className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 text-xs text-blue-900 flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <h5 className="font-semibold text-blue-950">Información para postulantes</h5>
            <p className="mt-0.5 text-blue-800 leading-relaxed">
              Al postularte, la Dirección de Empleo Municipal revisa tu perfil y efectúa la intermediación laboral con la empresa contratante. Tus datos están protegidos y solo se comparten con fines de selección laboral.
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}
