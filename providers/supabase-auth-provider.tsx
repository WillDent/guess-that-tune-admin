'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

type SupabaseAuthContext = {
  user: User | null
  loading: boolean
}

const Context = createContext<SupabaseAuthContext | undefined>(undefined)

export default function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)

      if (event === 'SIGNED_IN') {
        router.refresh()
      }
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <Context.Provider value={{ user, loading }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabaseAuth = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used inside SupabaseAuthProvider')
  }

  return context
}