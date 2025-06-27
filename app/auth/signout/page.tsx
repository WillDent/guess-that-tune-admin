'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const signOut = async () => {
      await supabase.auth.signOut()
      router.push('/login')
    }
    
    signOut()
  }, [supabase, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Signing out...</h1>
        <div className="animate-spin h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  )
}