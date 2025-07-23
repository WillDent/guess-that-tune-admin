'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Settings, 
  Edit, 
  Trophy,
  Target,
  Zap,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Twitter,
  Mail
} from 'lucide-react'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EditProfileModal } from '@/components/profile/edit-profile-modal'
import { ProfileSkeleton } from '@/components/profile/profile-skeleton'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, stats, loading, isOwnProfile } = useProfile()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  if (loading) {
    return (
      <ProtectedRoute>
        <ProfileSkeleton />
      </ProtectedRoute>
    )
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">
          <p className="text-gray-500">Profile not found</p>
        </div>
      </ProtectedRoute>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <ProtectedRoute>
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
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || ''} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.display_name || profile.email || 'U')}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-2xl font-bold">{profile.display_name || 'Unnamed User'}</h2>
                {profile.username && (
                  <p className="text-gray-600">@{profile.username}</p>
                )}
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
            
            {isOwnProfile && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Link href="/settings">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Statistics */}
        {stats && (
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
        )}

        {/* Tabs for Additional Content */}
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="sets">Question Sets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="achievements" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats && stats.totalGamesPlayed >= 10 && (
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
                
                {stats && stats.winRate >= 50 && (
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
                
                {stats && stats.accuracy >= 75 && (
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
                
                {stats && stats.totalQuestionSets >= 5 && (
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
              
              {(!stats || (stats.totalGamesPlayed < 10 && stats.winRate < 50 && stats.accuracy < 75 && stats.totalQuestionSets < 5)) && (
                <p className="text-center text-gray-500 py-8">
                  Keep playing to unlock achievements!
                </p>
              )}
            </Card>
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
              <span className="text-gray-600">Profile visibility</span>
              <Badge variant="outline">
                {profile.is_public ? 'Public' : 'Private'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Edit Profile Modal */}
        {isOwnProfile && (
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            profile={profile}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}