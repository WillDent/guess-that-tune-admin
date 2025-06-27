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
  Search,
  User,
  LogOut,
  Shield
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Browse Sets', href: '/browse', icon: Search },
  { name: 'Apple Music', href: '/music', icon: Music },
  { name: 'My Sets', href: '/questions', icon: ListMusic },
  { name: 'Games', href: '/games', icon: Gamepad2 },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const adminNavigation = [
  { name: 'Admin', href: '/admin', icon: Shield },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, loading, signOut, isAdmin } = useAuth()

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
        
        {/* Admin navigation */}
        {isAdmin && (
          <>
            <div className="my-4 border-t border-gray-800" />
            {adminNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
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
          </>
        )}
      </nav>
      
      {/* User section */}
      <div className="border-t border-gray-800 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-2">
            <LoadingSpinner size="sm" />
          </div>
        ) : user ? (
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-300">
              <User className="mr-2 h-4 w-4" />
              <span className="truncate">{user.email}</span>
            </div>
            <Button
              onClick={() => signOut()}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}