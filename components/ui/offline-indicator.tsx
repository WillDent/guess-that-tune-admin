'use client'

import { WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/use-online-status'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const { isOffline } = useNetworkStatus()

  if (!isOffline) return null

  return (
    <div className={cn(
      "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
      "bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg",
      "flex items-center space-x-2 animate-in slide-in-from-bottom-4"
    )}>
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">You're offline</span>
    </div>
  )
}