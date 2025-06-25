'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'

// For SSR compatibility
function getSnapshot() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

function getServerSnapshot() {
  return true // Always return true on server
}

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  return isOnline
}

// Hook with additional features
export function useNetworkStatus() {
  const isOnline = useOnlineStatus()
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
    } else if (wasOffline && isOnline) {
      // Just came back online
      setWasOffline(false)
    }
  }, [isOnline, wasOffline])

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    justCameOnline: wasOffline && isOnline
  }
}