// ABOUTME: Client component for dashboard interactivity
// ABOUTME: Displays stats and quick actions
'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Music, ListMusic, Gamepad2, Users, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalSongs: number
  questionSets: number
  activeGames: number
  totalPlayers: number
}

interface DashboardContentProps {
  stats: DashboardStats
}

export function DashboardContent({ stats }: DashboardContentProps) {
  const statCards = [
    { 
      name: 'Total Songs', 
      value: stats.totalSongs.toString(), 
      icon: Music, 
      color: 'text-pink-600',
      href: '/questions'
    },
    { 
      name: 'Question Sets', 
      value: stats.questionSets.toString(), 
      icon: ListMusic, 
      color: 'text-purple-600',
      href: '/questions'
    },
    { 
      name: 'Active Games', 
      value: stats.activeGames.toString(), 
      icon: Gamepad2, 
      color: 'text-blue-600',
      href: '/games'
    },
    { 
      name: 'Total Players', 
      value: stats.totalPlayers.toString(), 
      icon: Users, 
      color: 'text-green-600',
      href: '/games'
    },
  ]

  const quickActions = [
    {
      title: 'Browse Apple Music',
      description: 'Search Top 100 or explore genres',
      icon: Music,
      href: '/apple-music',
      color: 'text-pink-600'
    },
    {
      title: 'Create Question Set',
      description: 'Generate new questions from songs',
      icon: Plus,
      href: '/questions/new',
      color: 'text-purple-600'
    },
    {
      title: 'Start New Game',
      description: 'Host a game with your question sets',
      icon: Gamepad2,
      href: '/games/new',
      color: 'text-blue-600'
    },
    {
      title: 'View Analytics',
      description: 'Track performance and engagement',
      icon: TrendingUp,
      href: '/analytics',
      color: 'text-green-600'
    }
  ]

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-12 w-12 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Card key={action.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <action.icon className={`h-8 w-8 ${action.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {action.description}
                  </p>
                  <Link href={action.href}>
                    <Button variant="outline" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity (placeholder for future enhancement) */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <Card className="p-6">
          <p className="text-gray-600">
            Activity feed coming soon...
          </p>
        </Card>
      </div>
    </>
  )
}