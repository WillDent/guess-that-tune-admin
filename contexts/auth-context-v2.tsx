'use client'

import { createContext, useContext, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client-with-singleton'
import { useRouter } from 'next/navigation'
import { useAuthStateMachine } from '@/hooks/use-auth-state-machine'
import type { Database } from '@/lib/supabase/database.types'
import type { UserWithRole } from '@/utils/supabase/auth'

type UserRole = 'user' | 'admin' // Users table doesn't have a role field

interface AuthContextType {
  user: UserWithRole | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
  authInitialized: boolean
  // New state machine properties
  state: string
  error: Error | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('[AUTH-CONTEXT-V2] AuthProvider rendering')
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  
  // Use the auth state machine
  const {
    state,
    user,
    error,
    isAdmin,
    isAuthenticated,
    isLoading,
    isInitializing,
    events
  } = useAuthStateMachine()

  // Function to ensure user exists in users table
  const ensureUserExists = async (authUser: User) => {
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking user existence:', checkError)
        return
      }
      
      if (!existingUser && authUser.email) {
        console.log('Creating user row for:', authUser.id)
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (insertError) {
          console.error('Error creating user row:', insertError)
        }
      }
    } catch (err) {
      console.error('Error in ensureUserExists:', err)
    }
  }

  // Function to check and promote super admin
  const checkAndPromoteSuperAdmin = async (email: string) => {
    const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
    
    if (superAdminEmail && email === superAdminEmail) {
      // Users table doesn't have a role field
      // Admin status is determined by email match
      console.log('Super admin detected')
      return true
    }
    return false
  }

  // Function to fetch user role
  const fetchUserRole = async (userId: string): Promise<'user' | 'admin' | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) {
        console.error('Error fetching user:', error)
        if (error.code === 'PGRST116' || error.code === '42501') {
          return null
        }
        throw error
      }
      
      // Check if user is admin based on email
      const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
      if (data?.email && superAdminEmail && data.email === superAdminEmail) {
        return 'admin'
      }
      
      return 'user'
    } catch (err) {
      console.error('Error fetching user role:', err)
      return null
    }
  }

  // Enhanced user with role
  const enhanceUserWithRole = useCallback(async (authUser: User): Promise<UserWithRole> => {
    const role = await fetchUserRole(authUser.id)
    return {
      ...authUser,
      role: role || undefined
    }
  }, [])

  useEffect(() => {
    let mounted = true
    
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log('[AUTH-CONTEXT-V2] Initializing auth...')
        events.initialize()
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (sessionError) {
          console.error('[AUTH-CONTEXT-V2] Session error:', sessionError)
          events.loginFailure(sessionError)
          return
        }
        
        if (!session) {
          console.log('[AUTH-CONTEXT-V2] No session found')
          events.loginFailure(new Error('No session'))
          return
        }
        
        const authUser = session.user
        
        if (authUser) {
          console.log('[AUTH-CONTEXT-V2] Auth user found:', authUser.id)
          
          // Ensure user exists
          await ensureUserExists(authUser)
          
          // Check super admin
          if (authUser.email) {
            await checkAndPromoteSuperAdmin(authUser.email)
          }
          
          // Enhance with role
          const userWithRole = await enhanceUserWithRole(authUser)
          
          if (mounted) {
            events.loginSuccess(userWithRole)
          }
        }
      } catch (error) {
        console.error('[AUTH-CONTEXT-V2] Error initializing auth:', error)
        if (mounted) {
          events.loginFailure(error as Error)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AUTH-CONTEXT-V2] Auth state change:', event)
        
        if (!mounted) return
        
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              events.loginStart()
              // Defer async operations to avoid deadlock
              setTimeout(async () => {
                if (!mounted) return
                try {
                  await ensureUserExists(session.user)
                  if (session.user.email) {
                    await checkAndPromoteSuperAdmin(session.user.email)
                  }
                  const userWithRole = await enhanceUserWithRole(session.user)
                  events.loginSuccess(userWithRole)
                  router.refresh()
                } catch (error) {
                  console.error('[AUTH-CONTEXT-V2] Error in deferred auth operations:', error)
                  events.loginFailure(error as Error)
                }
              }, 0)
            }
            break
            
          case 'SIGNED_OUT':
            events.logout()
            router.push('/login')
            break
            
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              events.refreshStart()
              // Defer async operations to avoid deadlock
              setTimeout(async () => {
                if (!mounted) return
                try {
                  const userWithRole = await enhanceUserWithRole(session.user)
                  events.refreshSuccess(userWithRole)
                } catch (error) {
                  console.error('[AUTH-CONTEXT-V2] Error refreshing user:', error)
                }
              }, 0)
            }
            break
            
          case 'USER_UPDATED':
            if (session?.user) {
              events.refreshStart()
              // Defer async operations to avoid deadlock
              setTimeout(async () => {
                if (!mounted) return
                try {
                  const userWithRole = await enhanceUserWithRole(session.user)
                  events.refreshSuccess(userWithRole)
                } catch (error) {
                  console.error('[AUTH-CONTEXT-V2] Error updating user:', error)
                }
              }, 0)
            }
            break
        }
      }
    )

    // Set up periodic session refresh
    const refreshInterval = setInterval(async () => {
      console.log('[AUTH-CONTEXT-V2] Refreshing session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('[AUTH-CONTEXT-V2] Error refreshing session:', error)
        if (mounted && isAuthenticated) {
          events.sessionExpired()
        }
      } else if (session && mounted) {
        console.log('[AUTH-CONTEXT-V2] Session refreshed successfully')
      }
    }, 10 * 60 * 1000) // Refresh every 10 minutes

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [supabase, router, events, enhanceUserWithRole, isAuthenticated])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      // Auth state change listener will handle the logout event
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value: AuthContextType = {
    user,
    loading: isLoading,
    signOut,
    isAdmin,
    authInitialized: !isInitializing,
    state,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}