import { requireAuth } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ProfileStats } from '@/components/profile/profile-stats'
import { ProfileActions } from '@/components/profile/profile-actions'
import { MapPin, Link as LinkIcon, Twitter } from 'lucide-react'

export default async function ProfilePage() {
  const user = await requireAuth()
  const supabase = await createClient()
  
  // Fetch user stats
  const [
    { data: questionSets },
    { data: games },
    { data: favorites },
  ] = await Promise.all([
    supabase
      .from('question_sets')
      .select('id')
      .eq('user_id', user.id),
    supabase
      .from('game_participants')
      .select('score')
      .eq('user_id', user.id),
    supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id),
  ])
  
  const stats = {
    questionSetsCreated: questionSets?.length || 0,
    gamesPlayed: games?.length || 0,
    totalScore: games?.reduce((sum: number, g: any) => sum + (g.score || 0), 0) || 0,
    favoritesCount: favorites?.length || 0,
  }
  
  const memberSince = formatDistanceToNow(new Date(user.created_at), { addSuffix: true })
  
  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8">
      {/* Profile Header */}
      <Card className="p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>
                {user.display_name?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-3xl font-bold">
                {user.display_name || 'Anonymous User'}
              </h1>
              {user.username && (
                <p className="text-muted-foreground">@{user.username}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Member {memberSince}
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                {user.role === 'admin' && (
                  <Badge variant="destructive">Admin</Badge>
                )}
                <Badge variant="outline">Level {user.level || 1}</Badge>
                {user.experience && (
                  <Badge variant="secondary">{user.experience} XP</Badge>
                )}
              </div>
            </div>
          </div>
          
          <ProfileActions userId={user.id} />
        </div>
        
        {user.bio && (
          <p className="mt-6 text-muted-foreground">{user.bio}</p>
        )}
        
        <div className="flex flex-wrap gap-4 mt-6 text-sm text-muted-foreground">
          {user.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {user.location}
            </div>
          )}
          {user.website && (
            <a href={user.website} target="_blank" rel="noopener noreferrer" 
               className="flex items-center gap-1 hover:text-primary">
              <LinkIcon className="h-4 w-4" />
              Website
            </a>
          )}
          {user.twitter_handle && (
            <a href={`https://twitter.com/${user.twitter_handle}`} 
               target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 hover:text-primary">
              <Twitter className="h-4 w-4" />
              @{user.twitter_handle}
            </a>
          )}
        </div>
      </Card>
      
      {/* Stats */}
      <ProfileStats stats={stats} />
      
      {/* Activity and achievements sections would go here */}
    </div>
  )
}