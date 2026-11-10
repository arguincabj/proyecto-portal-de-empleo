import { Skeleton } from '@/components/ui/skeleton'

export default function PerfilLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Encabezado */}
      <div className="space-y-2 border-b border-border/60 pb-6">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* Banner de Estado laboral */}
      <div className="p-4 rounded-2xl bg-surface border border-border/60 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      {/* Tarjeta Datos Personales */}
      <div className="rounded-2xl bg-surface border border-border/60 p-6 shadow-card space-y-5">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <Skeleton className="size-9 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-60" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>

        <div className="pt-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Tarjeta Perfil Laboral */}
      <div className="rounded-2xl bg-surface border border-border/60 p-6 shadow-card space-y-5">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <Skeleton className="size-9 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-surface-muted border border-border/40 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
