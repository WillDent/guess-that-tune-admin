import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function QuestionSetGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration skeleton */}
      <div className="lg:col-span-1">
        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="pt-4">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
      </div>

      {/* Questions preview skeleton */}
      <div className="lg:col-span-2">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-12 w-12 rounded" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-28" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Skeleton className="h-10 w-10 rounded flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}