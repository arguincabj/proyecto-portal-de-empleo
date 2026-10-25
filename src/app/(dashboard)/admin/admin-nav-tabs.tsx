import Link from 'next/link'
import { Briefcase, Building2 } from 'lucide-react'

type Props = {
  tabActivo: 'ofertas' | 'empresas'
  pendientesOfertas?: number
  pendientesEmpresas?: number
}

export function AdminNavTabs({ tabActivo, pendientesOfertas, pendientesEmpresas }: Props) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
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
    </div>
  )
}
