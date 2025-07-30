import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Music, Play, Lock } from 'lucide-react'

interface QuestionSet {
  id: string
  name: string
  description?: string | null
  difficulty: string
  question_count: number
  is_public: boolean
  created_at: string
  user_id: string
  creator?: {
    username?: string | null
  }
}

interface QuestionSetGridProps {
  questionSets: QuestionSet[]
}

export function QuestionSetGrid({ questionSets }: QuestionSetGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {questionSets.map((set) => (
        <Link key={set.id} href={`/questions/${set.id}`}>
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 relative rounded-t-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <Music className="h-16 w-16 text-white/80" />
              </div>
              {!set.is_public && (
                <div className="absolute top-2 right-2">
                  <Lock className="h-5 w-5 text-white/80" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-1">{set.name}</h3>
              {set.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{set.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline">{set.difficulty}</Badge>
                  <Badge variant="secondary">{set.question_count} questions</Badge>
                </div>
                <Play className="h-5 w-5 text-gray-400" />
              </div>
              {set.creator?.username && (
                <p className="text-xs text-gray-500 mt-2">by {set.creator.username}</p>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}