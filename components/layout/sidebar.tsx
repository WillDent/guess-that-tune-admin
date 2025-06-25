// ABOUTME: Main navigation sidebar component
// ABOUTME: Contains links to different admin sections
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Music, 
  ListMusic, 
  Gamepad2, 
  BarChart3, 
  Settings,
  Search
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Browse Music', href: '/browse', icon: Search },
  { name: 'Question Sets', href: '/questions', icon: ListMusic },
  { name: 'Games', href: '/games', icon: Gamepad2 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center px-6">
        <Music className="h-8 w-8 text-pink-500" />
        <span className="ml-2 text-xl font-bold text-white">
          Guess That Tune
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive
                    ? 'text-pink-500'
                    : 'text-gray-400 group-hover:text-gray-300'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}