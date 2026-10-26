import Link from 'next/link'
import { Briefcase, Building2, Users } from 'lucide-react'

type Props = {
  tabActivo: 'ofertas' | 'empresas' | 'postulantes'
  pendientesOfertas?: number
  pendientesEmpresas?: number
  pendientesPostulantes?: number
}

export function AdminNavTabs({
  tabActivo,
  pendientesOfertas,
  pendientesEmpresas,
  pendientesPostulantes,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
      <Link
        href="/admin"
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          tabActivo === 'ofertas'
            ? 'bg-teal-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <Briefcase className="size-4" />
        <span>Aprobación de Ofertas</span>
        {typeof pendientesOfertas === 'number' && pendientesOfertas > 0 && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              tabActivo === 'ofertas'
                ? 'bg-white/20 text-white'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {pendientesOfertas}
          </span>
        )}
      </Link>

      <Link
        href="/admin/empresas"
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          tabActivo === 'empresas'
            ? 'bg-teal-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <Building2 className="size-4" />
        <span>Aprobación de Empresas</span>
        {typeof pendientesEmpresas === 'number' && pendientesEmpresas > 0 && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              tabActivo === 'empresas'
                ? 'bg-white/20 text-white'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            {pendientesEmpresas}
          </span>
        )}
      </Link>

      <Link
        href="/admin/postulantes"
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          tabActivo === 'postulantes'
            ? 'bg-teal-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <Users className="size-4" />
        <span>Gestión de Postulantes</span>
        {typeof pendientesPostulantes === 'number' && pendientesPostulantes > 0 && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              tabActivo === 'postulantes'
                ? 'bg-white/20 text-white'
                : 'bg-teal-100 text-teal-800'
            }`}
          >
            {pendientesPostulantes}
          </span>
        )}
      </Link>
    </div>
  )
}
