import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function QuestionSetSkeleton() {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
        <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
      </div>
      
      <div className="space-y-2 mb-3 sm:mb-4">
        <Skeleton className="h-4 w-20 sm:w-24" />
        <Skeleton className="h-4 w-28 sm:w-32" />
        <Skeleton className="h-4 w-32 sm:w-36" />
      </div>

      <div className="flex gap-1 sm:gap-2">
        <Skeleton className="h-8 sm:h-9 flex-1" />
        <Skeleton className="h-8 sm:h-9 flex-1" />
        <Skeleton className="h-8 sm:h-9 w-8 sm:w-9" />
      </div>
    </Card>
  )
}

export function QuestionSetGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <QuestionSetSkeleton key={i} />
      ))}
    </div>
  )
}