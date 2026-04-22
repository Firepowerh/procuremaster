import { Skeleton } from '@/components/ui/skeleton'

export default function ContractsLoading() {
  return (
    <div className="space-y-5 max-w-4xl">
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-60" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
