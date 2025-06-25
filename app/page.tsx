// ABOUTME: Main landing page for the admin dashboard
// ABOUTME: Displays overview stats and quick actions
import { Card } from '@/components/ui/card'
import { Music, ListMusic, Gamepad2, Users } from 'lucide-react'

const stats = [
  { name: 'Total Songs', value: '0', icon: Music, color: 'text-pink-600' },
  { name: 'Question Sets', value: '0', icon: ListMusic, color: 'text-purple-600' },
  { name: 'Active Games', value: '0', icon: Gamepad2, color: 'text-blue-600' },
  { name: 'Total Players', value: '0', icon: Users, color: 'text-green-600' },
]

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, Skooter! Here's your game overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
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
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/browse" className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <p className="font-medium">Browse Apple Music</p>
              <p className="text-sm text-gray-600">Search Top 100 or explore genres</p>
            </a>
            <a href="/questions/new" className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <p className="font-medium">Create Question Set</p>
              <p className="text-sm text-gray-600">Generate new questions from songs</p>
            </a>
            <a href="/games/new" className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <p className="font-medium">Create New Game</p>
              <p className="text-sm text-gray-600">Build a game from question sets</p>
            </a>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <Music className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activity yet</p>
            <p className="text-sm mt-1">Start by browsing music to create your first game!</p>
          </div>
        </Card>
      </div>
    </div>
  )
}