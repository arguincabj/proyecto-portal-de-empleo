import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, ShieldCheck, Briefcase, Clock, Banknote } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function OfertaDetalleLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center">
        <Link
          href="/ofertas"
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary-600"
        >
          <ArrowLeft className="size-4" />
          <span>Volver a todas las ofertas</span>
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface border border-border/60 shadow-card">
        {/* Cabecera */}
        <div className="p-6 sm:p-8 border-b border-border/60 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          <Skeleton className="h-8 w-3/4 max-w-lg rounded-lg" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-border/40">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted border border-border/40">
                <Skeleton className="size-8 rounded-lg" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 space-y-3">
            <Skeleton className="h-5 w-40" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-lg" />
              <Skeleton className="h-7 w-32 rounded-lg" />
              <Skeleton className="h-7 w-28 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Bloque de Postulación Skeleton */}
      <div className="rounded-xl bg-surface border border-border/60 p-6 shadow-card space-y-4">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <div className="flex justify-end pt-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
