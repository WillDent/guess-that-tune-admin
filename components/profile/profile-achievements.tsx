import { Card } from '@/components/ui/card'
import { Trophy, Target, Zap, BookOpen, Award } from 'lucide-react'

interface ProfileAchievementsProps {
  stats: {
    totalGamesPlayed: number
    winRate: number
    accuracy: number
    totalQuestionSets: number
  }
}

export function ProfileAchievements({ stats }: ProfileAchievementsProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Award className="h-5 w-5" />
        Achievements
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.totalGamesPlayed >= 10 && (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-800 rounded-full">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="font-semibold">Game Veteran</p>
              <p className="text-sm text-gray-600">Played 10+ games</p>
            </div>
          </div>
        )}
        
        {stats.winRate >= 50 && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold">Sharp Shooter</p>
              <p className="text-sm text-gray-600">50%+ win rate</p>
            </div>
          </div>
        )}
        
        {stats.accuracy >= 75 && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">Music Expert</p>
              <p className="text-sm text-gray-600">75%+ accuracy</p>
            </div>
          </div>
        )}
        
        {stats.totalQuestionSets >= 5 && (
          <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-full">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold">Content Creator</p>
              <p className="text-sm text-gray-600">Created 5+ question sets</p>
            </div>
          </div>
        )}
      </div>
      
      {(stats.totalGamesPlayed < 10 && stats.winRate < 50 && stats.accuracy < 75 && stats.totalQuestionSets < 5) && (
        <p className="text-center text-gray-500 py-8">
          Keep playing to unlock achievements!
        </p>
      )}
    </Card>
  )
}