'use client'

import { useEffect } from 'react'
import { signOut } from '@/lib/auth/actions'

export default function SignOutPage() {
  useEffect(() => {
    signOut()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          {error || 'Signing out...'}
        </h1>
        <div className="animate-spin h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
        {error && (
          <p className="text-gray-400 mt-4 text-sm">
            Redirecting to login page...
          </p>
        )}
      </div>
    </div>
  )
}