import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Profile Card Skeleton */}
      <Card className="p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-40 mb-3" />
              <Skeleton className="h-4 w-64 mb-2" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </Card>

      {/* Statistics Skeleton */}
      <Card className="p-6 mb-8">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-9 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs Skeleton */}
      <div className="w-full">
        <div className="flex space-x-1 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}