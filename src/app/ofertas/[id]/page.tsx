import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { BotonPostular } from './boton-postular'
import { ArrowLeft, Building2, Calendar, ShieldCheck, Briefcase } from 'lucide-react'

// Forzar renderizado dinámico para que siempre evalúe el usuario logueado, su perfil y sus CVs actualizados
export const dynamic = 'force-dynamic'

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

  const categorias = (ofertaCategorias as Array<{ categoria: { nombre: string } | { nombre: string }[] | null }> | null)
    ?.map((item) => {
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
  let estadoLaboral: string | null = null
  let perfilIncompleto = false
  let cvsDisponibles: Array<{ id: string; nombre: string }> = []

  if (user) {
    let { data: usuario } = await supabase
      .from('usuarios')
      .select('rol, nombre, apellido, telefono')
      .eq('id', user.id)
      .single()

    if (!usuario) {
      const { data: adminUsuario } = await supabaseAdmin
        .from('usuarios')
        .select('rol, nombre, apellido, telefono')
        .eq('id', user.id)
        .single()
      usuario = adminUsuario
    }

    userRole = usuario?.rol ?? null

    if (userRole === 'postulante') {
      let postulante: {
        id: string
        cv_url: string | null
        estado_laboral?: string | null
        dni: string | null
        localidad?: string | null
        direccion?: string | null
        codigo_postal?: string | null
        estudios?: string | null
        experiencia?: string | null
        habilidades?: string | null
        cursos?: string | null
        idiomas?: string | null
        horarios?: string | null
      } | null = null

      // Intentar consulta completa con columnas nuevas si existen
      const { data: postData, error: postErr } = await supabaseAdmin
        .from('postulantes')
        .select('id, cv_url, estado_laboral, dni, localidad, direccion, codigo_postal, estudios, experiencia, habilidades, cursos, idiomas, horarios')
        .eq('usuario_id', user.id)
        .single()

      if (!postErr && postData) {
        postulante = postData
      } else {
        // Fallback seguro si faltan columnas como localidad/direccion en la tabla postulantes
        const { data: basicPost } = await supabaseAdmin
          .from('postulantes')
          .select('id, cv_url, estado_laboral, dni, estudios, experiencia, habilidades, cursos, idiomas, horarios')
          .eq('usuario_id', user.id)
          .single()
        postulante = basicPost ?? null
      }

      if (postulante) {
        estadoLaboral = postulante.estado_laboral || (user.user_metadata?.estado_laboral as string) || null

        // Comprobación de perfil incompleto:
        // 1. Datos personales requeridos: nombre, apellido, teléfono, DNI, localidad
        const tieneNombre = !!(usuario?.nombre || user.user_metadata?.nombre)
        const tieneApellido = !!(usuario?.apellido || user.user_metadata?.apellido)
        const tieneTelefono = !!(usuario?.telefono || user.user_metadata?.telefono)
        const tieneDni = !!(postulante.dni || user.user_metadata?.dni)
        const tieneLocalidad = !!(postulante.localidad || user.user_metadata?.localidad)
        const datosPersonalesCompletos = tieneNombre && tieneApellido && tieneTelefono && tieneDni && tieneLocalidad

        // 2. Perfil laboral: se requiere que al menos uno de los campos principales esté completado
        const tieneEstudios = Boolean(postulante.estudios && postulante.estudios.trim())
        const tieneExperiencia = Boolean(postulante.experiencia && postulante.experiencia.trim())
        const tieneHabilidades = Boolean(postulante.habilidades && postulante.habilidades.trim())
        const tieneCursos = Boolean(postulante.cursos && postulante.cursos.trim())
        const datosLaboralesCompletos = tieneEstudios || tieneExperiencia || tieneHabilidades || tieneCursos

        perfilIncompleto = !datosPersonalesCompletos || !datosLaboralesCompletos

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

        // Obtener CVs disponibles del postulante desde la tabla curricula
        try {
          const { data: dbCurricula } = await supabaseAdmin
            .from('curricula')
            .select('id, nombre')
            .eq('postulante_id', postulante.id)
            .order('created_at', { ascending: false })

          if (dbCurricula && dbCurricula.length > 0) {
            cvsDisponibles = dbCurricula.map((c) => ({
              id: c.id,
              nombre: c.nombre || 'Currículum',
            }))
          }
        } catch {
          // ignore
        }

        // Si todavía tiene un CV previo en postulantes.cv_url, agregarlo a la lista de opciones
        if (postulante.cv_url) {
          const nombreArchivo = postulante.cv_url.split('/').pop()?.replace(/^\d+-/, '') || 'Currículum subido'
          const yaEstaEnLista = cvsDisponibles.some((c) => c.nombre === nombreArchivo)
          if (!yaEstaEnLista) {
            cvsDisponibles.push({
              id: 'legacy',
              nombre: nombreArchivo,
            })
          }
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navegación / Volver */}
      <div>
        <Link
          href="/ofertas"
          className="inline-flex items-center gap-2 text-xs font-bold text-foreground-secondary hover:text-primary-600 transition-colors bg-surface px-3.5 py-2 rounded-xl shadow-card border border-border/60"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver a todas las ofertas</span>
        </Link>
      </div>

      {/* Encabezado Principal */}
      <section className="rounded-xl bg-surface shadow-card border border-border/60 p-6 sm:p-8 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary-600">
            <Building2 className="size-4" />
            <span>{oferta.empresa_nombre}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1.5">
            {oferta.titulo}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-foreground-muted pt-2 border-t border-border/60">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            Publicada el {fechaPublicacion}
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary-600" />
            Portal Municipal de Empleo de Funes
          </span>
        </div>

        {/* Categorías */}
        {categorias && categorias.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {categorias.map((cat, idx) => (
              <span
                key={idx}
                className="bg-primary-50 text-primary-700 text-xs px-3 py-1 rounded-lg font-medium border border-primary-100"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Detalle y Requisitos */}
      <section className="rounded-xl bg-surface shadow-card border border-border/60 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-foreground">
          <Briefcase className="size-5 text-primary-600" />
          <h2>Descripción del Puesto</h2>
        </div>
        <div className="text-foreground-secondary whitespace-pre-line leading-relaxed text-sm sm:text-base">
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
          estadoLaboral={estadoLaboral}
          cvsDisponibles={cvsDisponibles}
          perfilIncompleto={perfilIncompleto}
        />
      </section>

      {/* Información Adicional Municipal */}
      <footer className="bg-primary-50/70 border border-primary-100 rounded-xl p-5 text-xs text-primary-900 flex items-start gap-3">
        <ShieldCheck className="size-5 text-primary-600 shrink-0 mt-0.5" />
        <div>
          <h5 className="font-bold text-primary-950">Información para postulantes</h5>
          <p className="mt-0.5 text-primary-800 leading-relaxed">
            Al postularte, la Oficina de Empleo Municipal revisa tu perfil y efectúa la intermediación laboral con la empresa contratante. Tus datos están protegidos y solo se comparten con fines de selección laboral.
          </p>
        </div>
      </footer>
    </div>
  )
}
