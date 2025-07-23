import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'

interface ProfileQuestionSetsProps {
  userId: string
  isOwnProfile: boolean
}

export function ProfileQuestionSets({ userId, isOwnProfile }: ProfileQuestionSetsProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        Question Sets
      </h3>
      {isOwnProfile ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">View and manage your question sets</p>
          <Link href="/questions">
            <Button>
              Go to My Sets
            </Button>
          </Link>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">
          Public question sets will appear here
        </p>
      )}
    </Card>
  )
}