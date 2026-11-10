import { Skeleton } from '@/components/ui/skeleton'

export function OfertasSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>

      <ul className="flex flex-col gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <li
            key={i}
            className="rounded-xl bg-surface p-6 shadow-card border border-border/60 flex flex-col sm:flex-row justify-between gap-4"
          >
            <div className="flex flex-col gap-3 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3.5 w-full max-w-2xl" />
                <Skeleton className="h-3.5 w-3/4 max-w-xl" />
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-border/40 shrink-0">
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
