'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const signOut = async () => {
      try {
        const supabase = createClient()
        
        // Clear all auth data
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.error('Sign out error:', error)
          setError('Failed to sign out. Clearing session manually...')
        }
        
        // Clear local storage and session storage as backup
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
          
          // Delete cookies
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        }
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
        
      } catch (err) {
        console.error('Unexpected error during sign out:', err)
        setError('An error occurred. Redirecting...')
        
        // Force redirect even on error
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    }
    
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