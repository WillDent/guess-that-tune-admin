import { Skeleton } from '@/components/ui/skeleton'

export function SongSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-2">
      <Skeleton className="w-12 h-12 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function SongListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SongSkeleton key={i} />
      ))}
    </div>
  )
}