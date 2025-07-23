import { Card } from '@/components/ui/card'
import { Trophy, Target, Zap, BookOpen } from 'lucide-react'

interface ProfileStatsProps {
  stats: {
    questionSetsCreated: number
    gamesPlayed: number
    totalScore: number
    favoritesCount: number
  }
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Question Sets</p>
            <p className="text-2xl font-bold">{stats.questionSetsCreated}</p>
          </div>
          <BookOpen className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Games Played</p>
            <p className="text-2xl font-bold">{stats.gamesPlayed}</p>
          </div>
          <Target className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Score</p>
            <p className="text-2xl font-bold">{stats.totalScore.toLocaleString()}</p>
          </div>
          <Trophy className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Favorites</p>
            <p className="text-2xl font-bold">{stats.favoritesCount}</p>
          </div>
          <Zap className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </Card>
    </div>
  )
}