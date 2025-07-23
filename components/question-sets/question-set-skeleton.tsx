import { Card } from '@/components/ui/card'

interface QuestionSetSkeletonProps {
  count?: number
}

export function QuestionSetSkeleton({ count = 6 }: QuestionSetSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="h-6 bg-muted animate-pulse rounded" />
            
            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            </div>
            
            {/* Stats */}
            <div className="flex justify-between pt-4">
              <div className="h-4 bg-muted animate-pulse rounded w-20" />
              <div className="h-4 bg-muted animate-pulse rounded w-20" />
            </div>
            
            {/* User info */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-24" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}