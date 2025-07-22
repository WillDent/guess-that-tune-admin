'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DevLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function signInDev() {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'will@dent.ly',
        password: 'Odessa99!'
      })
      
      if (error) {
        console.error('Dev login error:', error)
      } else {
        console.log('Dev login success:', data)
        router.push('/music')
      }
    }
    
    signInDev()
  }, [])

  return <div>Logging in for development...</div>
}