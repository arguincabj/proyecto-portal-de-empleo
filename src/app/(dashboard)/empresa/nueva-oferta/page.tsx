import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NuevaOfertaForm } from './nueva-oferta-form'

export default async function NuevaOfertaEmpresaPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Verificar rol
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (usuario?.rol !== 'empresa') {
    redirect('/inicio')
  }

  // Obtener perfil de empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('razon_social')
    .eq('usuario_id', user.id)
    .single()

  // Obtener categorías disponibles
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nombre')
    .order('nombre', { ascending: true })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Volver */}
      <div>
        <Link
          href="/empresa"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 transition-colors font-medium"
        >
          <span>←</span> Volver al panel de empresa
        </Link>
      </div>

      {/* Tarjeta de Formulario */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
        <div className="border-b border-gray-100 pb-5">
          <h1 className="text-2xl font-bold text-gray-900">Publicar Nueva Oferta Laboral</h1>
          <p className="text-sm text-gray-500 mt-1">
            Completá los datos del puesto para que los postulantes de la ciudad puedan enviar sus solicitudes.
          </p>
        </div>

        <NuevaOfertaForm
          razonSocial={empresa?.razon_social ?? 'Empresa'}
          categorias={categorias ?? []}
        />
      </div>
    </div>
  )
}
