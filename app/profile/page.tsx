import { requireAuth } from '@/lib/auth/server'
import { createServerClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Trophy,
  Target,
  Zap,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Twitter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ProfileActions } from '@/components/profile/profile-actions-client'
import { ProfileAchievements } from '@/components/profile/profile-achievements'
import { ProfileQuestionSets } from '@/components/profile/profile-question-sets'
import { notFound } from 'next/navigation'

interface ProfileStats {
  totalGamesPlayed: number
  totalGamesWon: number
  winRate: number
  accuracy: number
  totalQuestionsAnswered: number
  correctAnswers: number
  totalQuestionSets: number
  publicQuestionSets: number
}

async function getProfile(userId: string) {
  const supabase = await createServerClient()
  
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return profile
}

async function getProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = await createServerClient()
  
  // Fetch game statistics
  const { data: gameStats } = await supabase
    .from('game_participants')
    .select('score, placement')
    .eq('user_id', userId)
  
  const totalGamesPlayed = gameStats?.length || 0
  const totalGamesWon = gameStats?.filter((g: any) => g.placement === 1).length || 0
  const winRate = totalGamesPlayed > 0 ? (totalGamesWon / totalGamesPlayed) * 100 : 0
  
  // For now, we'll use mock data for question accuracy
  // This would need proper implementation based on your game result schema
  const totalQuestionsAnswered = totalGamesPlayed * 10 // Assuming 10 questions per game
  const correctAnswers = Math.floor(totalQuestionsAnswered * 0.7) // 70% accuracy
  const accuracy = totalQuestionsAnswered > 0 ? (correctAnswers / totalQuestionsAnswered) * 100 : 0
  
  // Fetch question set statistics
  const { count: totalQuestionSets } = await supabase
    .from('question_sets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  const { count: publicQuestionSets } = await supabase
    .from('question_sets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_public', true)
  
  return {
    totalGamesPlayed,
    totalGamesWon,
    winRate,
    accuracy,
    totalQuestionsAnswered,
    correctAnswers,
    totalQuestionSets: totalQuestionSets || 0,
    publicQuestionSets: publicQuestionSets || 0
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default async function ProfilePage() {
  const user = await requireAuth()
  const profile = await getProfile(user.id)
  
  if (!profile) {
    notFound()
  }
  
  const stats = await getProfileStats(user.id)
  const isOwnProfile = user.id === profile.id
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">Manage your profile and view your statistics</p>
      </div>

      {/* Profile Card */}
      <Card className="p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.name || ''} />
              <AvatarFallback className="text-2xl">
                {getInitials(profile.name || profile.email || 'U')}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-2xl font-bold">{profile.name || 'Unnamed User'}</h2>
              <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
              
              {profile.bio && (
                <p className="mt-3 text-gray-700 max-w-md">{profile.bio}</p>
              )}
              
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile.website && (
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-purple-600"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Website
                  </a>
                )}
                {profile.twitter_handle && (
                  <a 
                    href={`https://twitter.com/${profile.twitter_handle}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-purple-600"
                  >
                    <Twitter className="h-4 w-4" />
                    @{profile.twitter_handle}
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {isOwnProfile && <ProfileActions />}
        </div>
      </Card>

      {/* Statistics */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Statistics
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.totalGamesPlayed}</div>
            <p className="text-sm text-gray-600 mt-1">Games Played</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalGamesWon}</div>
            <p className="text-sm text-gray-600 mt-1">Games Won</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.winRate.toFixed(1)}%</div>
            <p className="text-sm text-gray-600 mt-1">Win Rate</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.accuracy.toFixed(1)}%</div>
            <p className="text-sm text-gray-600 mt-1">Accuracy</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-semibold">{stats.totalQuestionsAnswered}</div>
            <p className="text-sm text-gray-600 mt-1">Questions Answered</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold">{stats.correctAnswers}</div>
            <p className="text-sm text-gray-600 mt-1">Correct Answers</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold">{stats.totalQuestionSets}</div>
            <p className="text-sm text-gray-600 mt-1">Question Sets</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold">{stats.publicQuestionSets}</div>
            <p className="text-sm text-gray-600 mt-1">Public Sets</p>
          </div>
        </div>
      </Card>

      {/* Tabs for Additional Content */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="sets">Question Sets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="achievements" className="mt-6">
          <ProfileAchievements stats={stats} />
        </TabsContent>
        
        <TabsContent value="activity" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </h3>
            <p className="text-center text-gray-500 py-8">
              Activity tracking coming soon...
            </p>
          </Card>
        </TabsContent>
        
        <TabsContent value="sets" className="mt-6">
          <ProfileQuestionSets userId={user.id} isOwnProfile={isOwnProfile} />
        </TabsContent>
      </Tabs>

      {/* Account Info */}
      <Card className="p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Account Information
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Member since</span>
            <span className="font-medium">
              {profile.created_at ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true }) : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last updated</span>
            <span className="font-medium">
              {profile.updated_at ? formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true }) : 'Never'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email verified</span>
            <Badge variant={profile.email_confirmed_at ? "outline" : "secondary"}>
              {profile.email_confirmed_at ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Account role</span>
            <Badge variant="outline">
              {profile.role === 'admin' ? 'Administrator' : 'User'}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}