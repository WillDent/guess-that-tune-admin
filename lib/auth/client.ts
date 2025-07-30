'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthState {
  user: UserProfile | null
  loading: boolean
  isAdmin: boolean
}

/**
 * Client-side auth hook for UI state only
 * Authentication logic should be handled server-side
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false,
  })
  
  const router = useRouter()
  const supabase = createClient()
  
  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()
            
          setState({
            user: profile,
            loading: false,
            isAdmin: profile?.role === 'admin',
          })
        } else {
          setState({ user: null, loading: false, isAdmin: false })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setState({ user: null, loading: false, isAdmin: false })
      }
    }
    
    initAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Defer async operations to avoid deadlock
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()
              
            setState({
              user: profile,
              loading: false,
              isAdmin: profile?.role === 'admin',
            })
          }, 0)
        } else if (event === 'SIGNED_OUT') {
          setState({ user: null, loading: false, isAdmin: false })
          router.push('/login')
        }
        
        // Refresh the page to update server components
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          router.refresh()
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      // Force redirect even on error
      router.push('/login')
    }
  }
  
  return {
    user: state.user,
    loading: state.loading,
    isAdmin: state.isAdmin,
    signOut,
  }
}