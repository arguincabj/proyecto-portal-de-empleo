import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PerfilForm } from './perfil-form'
import { PerfilLaboralForm } from './perfil-laboral-form'
import { CvUpload } from './cv-upload'
import { FotoPerfilUpload } from '@/components/perfil/foto-perfil-upload'

const CV_BUCKET = 'curricula'

// Paths con formato `<usuario>/<timestamp>-<nombre>.<ext>`; los subidos antes no tienen nombre
function datosCv(path: string) {
  const archivo = path.split('/').pop() ?? ''
  const match = archivo.match(/^(\d+)(?:-(.+))?\.(\w+)$/)
  if (!match) return { nombre: archivo, fecha: null }

  const [, timestamp, nombre, ext] = match
  const fecha = new Date(Number(timestamp)).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  return { nombre: `${nombre ?? 'curriculum'}.${ext}`, fecha }
}

export default async function PerfilPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido, telefono, rol')
    .eq('id', user.id)
    .single()

  if (!usuario) {
    const { data: adminUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('nombre, apellido, telefono, rol')
      .eq('id', user.id)
      .single()
    usuario = adminUsuario
  }

  if (usuario?.rol && usuario.rol !== 'postulante') {
    redirect('/inicio')
  }

  let postulante: {
    dni: string | null
    localidad?: string | null
    direccion?: string | null
    codigo_postal?: string | null
    cv_url: string | null
    estudios?: string | null
    cursos?: string | null
    experiencia?: string | null
    idiomas?: string | null
    habilidades?: string | null
    horarios?: string | null
  } | null = null

  // Intento de consulta completa con campos de perfil laboral y domicilio
  const { data: postData, error: postErr } = await supabaseAdmin
    .from('postulantes')
    .select('dni, cv_url, localidad, direccion, codigo_postal, estudios, cursos, experiencia, idiomas, habilidades, horarios')
    .eq('usuario_id', user.id)
    .single()

  if (!postErr && postData) {
    postulante = postData
  } else {
    // Si la migración aún no se corrió, se consulta lo básico sin fallar
    const { data: basicPost } = await supabaseAdmin
      .from('postulantes')
      .select('dni, cv_url')
      .eq('usuario_id', user.id)
      .single()
    postulante = basicPost ?? null
  }

  const meta = user.user_metadata || {}

  let cvFirmadaUrl: string | null = null
  let cv: { nombre: string; fecha: string | null } | null = null
  if (postulante?.cv_url) {
    cv = datosCv(postulante.cv_url)
    const { data } = await supabaseAdmin.storage
      .from(CV_BUCKET)
      .createSignedUrl(postulante.cv_url, 3600)
    cvFirmadaUrl = data?.signedUrl ?? null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mi perfil</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Tus datos personales, perfil laboral y currículum vitae.
        </p>
      </div>

      <section className="rounded-xl bg-surface p-4 shadow-card sm:p-6 space-y-6">
        <div>
          <h2 className="mb-4 text-base font-semibold text-foreground">Foto de perfil</h2>
          <FotoPerfilUpload
            currentAvatarUrl={user.user_metadata?.avatar_url || (usuario as any)?.avatar_url || null}
            nombre={usuario?.nombre ?? (meta.nombre as string) ?? ''}
            apellido={usuario?.apellido ?? (meta.apellido as string) ?? ''}
            rol="postulante"
          />
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Datos personales y domicilio</h2>
          <PerfilForm
          defaultValues={{
            nombre: usuario?.nombre ?? (meta.nombre as string) ?? '',
            apellido: usuario?.apellido ?? (meta.apellido as string) ?? '',
            telefono: usuario?.telefono ?? (meta.telefono as string) ?? '',
            dni: postulante?.dni ?? (meta.dni as string) ?? '',
            localidad: postulante?.localidad || (meta.localidad as string) || '',
            direccion: postulante?.direccion || (meta.direccion as string) || '',
            codigo_postal: postulante?.codigo_postal || (meta.codigo_postal as string) || '',
          }}
        />
        </div>
      </section>

      <section className="rounded-xl bg-surface p-4 shadow-card sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Perfil laboral</h2>
          <p className="text-xs text-foreground-secondary">
            Completá tus estudios, cursos, experiencia, idiomas, habilidades y disponibilidad horaria.
          </p>
        </div>
        <PerfilLaboralForm
          defaultValues={{
            estudios: postulante?.estudios ?? '',
            cursos: postulante?.cursos ?? '',
            experiencia: postulante?.experiencia ?? '',
            idiomas: postulante?.idiomas ?? '',
            habilidades: postulante?.habilidades ?? '',
            horarios: postulante?.horarios ?? '',
          }}
        />
      </section>

      <section className="rounded-xl bg-surface p-4 shadow-card sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Currículum vitae</h2>
        <CvUpload cvUrl={cvFirmadaUrl} cv={cv} />
      </section>
    </div>
  )
}
