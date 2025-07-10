'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'
import { debugLog } from '@/lib/debug-logger'

type UserRole = Database['public']['Tables']['users']['Row']['role']
type UserWithRole = User & {
  role?: UserRole
}

interface AuthContextType {
  user: UserWithRole | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
  authInitialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('[AUTH-CONTEXT] AuthProvider rendering')
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)
  const router = useRouter()
  const [supabase] = useState(() => createSupabaseBrowserClient())

  // Function to ensure user exists in users table
  const ensureUserExists = async (authUser: User) => {
    try {
      // First check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking user existence:', checkError)
        return
      }
      
      // If user doesn't exist, create them
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
        } else {
          console.log('User row created successfully')
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
      try {
        // Update user role directly to admin
        const { error } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('email', email)
        
        if (!error) {
          console.log('Super admin promoted successfully')
          return true
        }
      } catch (err) {
        console.error('Error promoting super admin:', err)
      }
    }
    return false
  }

  // Function to fetch user role
  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      console.log('Fetching role for user:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle instead of single to handle missing rows
      
      if (error) {
        console.error('Error fetching user role:', error.message, error.code, error.details)
        // If it's an RLS error or row not found, return null instead of throwing
        if (error.code === 'PGRST116' || error.code === '42501') {
          console.log('User row not found or RLS policy blocked access, continuing without role')
          return null
        }
        throw error
      }
      console.log('User role fetched:', data?.role)
      return data?.role || null
    } catch (err) {
      console.error('Error fetching user role:', err)
      return null
    }
  }

  useEffect(() => {
    let mounted = true;
    
    // Skip on server side
    if (typeof window === 'undefined') {
      console.log('[AUTH-CONTEXT] Skipping useEffect on server')
      return
    }
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        debugLog('[AUTH-CONTEXT] Starting getInitialSession...')
        debugLog('[AUTH-CONTEXT] Window available:', typeof window !== 'undefined')
        debugLog('[AUTH-CONTEXT] Document cookie:', document.cookie)
        
        // Get the session from cookies
        debugLog('[AUTH-CONTEXT] Calling supabase.auth.getUser()...')
        try {
          // Try getUser like the middleware does
          const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
          
          debugLog('[AUTH-CONTEXT] getUser result:', {
            hasUser: !!authUser,
            userEmail: authUser?.email,
            userId: authUser?.id,
            error: userError,
            timestamp: new Date().toISOString()
          })
          
          // If we have a user, create a session-like object
          const session = authUser ? { user: authUser } : null
          const sessionError = userError
          
          debugLog('[AUTH-CONTEXT] getSession result:', {
            hasSession: !!session,
            sessionUser: session?.user?.email,
            sessionUserId: session?.user?.id,
            error: sessionError,
            timestamp: new Date().toISOString()
          })
          
          if (!mounted) return;
          
          if (sessionError) {
            console.error('[AUTH-CONTEXT] Session error:', sessionError)
            setLoading(false)
            return
          }
          
          console.log('[AUTH-CONTEXT] Session:', session ? 'exists' : 'none')
          
          if (!session) {
            console.log('[AUTH-CONTEXT] No session found in getInitialSession')
            if (mounted) {
              setUser(null)
              setIsAdmin(false)
              setLoading(false)
              setAuthInitialized(true)
            }
            return
          }
        
        const sessionUser = session.user
        
        if (sessionUser) {
          console.log('[AUTH-CONTEXT] Auth user found:', sessionUser.id, sessionUser.email)
          
          // Set basic user state immediately to prevent loading hang
          if (mounted) {
            console.log('[AUTH-CONTEXT] Setting initial user state immediately')
            setUser(sessionUser)
            setLoading(false)
            setAuthInitialized(true)
          }
          
          // Then try to enhance with database operations in the background
          try {
            await ensureUserExists(sessionUser)
            console.log('[AUTH-CONTEXT] User row ensured in database')
            
            // Check if this user should be promoted to super admin
            if (sessionUser.email) {
              await checkAndPromoteSuperAdmin(sessionUser.email)
            }
            
            // Fetch user role
            const role = await fetchUserRole(sessionUser.id)
            console.log('[AUTH-CONTEXT] User role fetched:', role)
            
            const userWithRole: UserWithRole = {
              ...sessionUser,
              role: role || undefined
            }
            
            if (mounted) {
              console.log('[AUTH-CONTEXT] Updating user with role:', userWithRole.email, 'Admin:', role === 'admin')
              setUser(userWithRole)
              setIsAdmin(role === 'admin')
            }
          } catch (dbError) {
            console.error('[AUTH-CONTEXT] Error with database operations:', dbError)
            // User is already set, just log the error
          }
        } else {
          console.log('[AUTH-CONTEXT] No auth user found')
          if (mounted) {
            console.log('[AUTH-CONTEXT] Setting null user, loading false')
            setUser(null)
            setIsAdmin(false)
            setLoading(false)
            setAuthInitialized(true)
          }
        }
        } catch (getSessionError) {
          debugLog('[AUTH-CONTEXT] Error in getSession:', {
            error: getSessionError,
            message: getSessionError instanceof Error ? getSessionError.message : 'Unknown error',
            stack: getSessionError instanceof Error ? getSessionError.stack : undefined
          })
          if (mounted) {
            setUser(null)
            setIsAdmin(false)
            setLoading(false)
            setAuthInitialized(true)
          }
        }
      } catch (error) {
        console.error('Error getting user:', error)
        if (mounted) {
          setUser(null)
          setIsAdmin(false)
          setLoading(false)
          setAuthInitialized(true)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH-CONTEXT] onAuthStateChange event:', event, 'session:', session)
        const authUser = session?.user ?? null
        
        if (authUser && mounted) {
          // Immediately set user to prevent loading hang
          console.log('[AUTH-CONTEXT] onAuthStateChange - Immediately setting user')
          setUser(authUser)
          setLoading(false)
          setAuthInitialized(true)
          
          try {
            // Ensure user exists on sign in
            if (event === 'SIGNED_IN') {
              await ensureUserExists(authUser)
              console.log('[AUTH-CONTEXT] User row ensured on sign in')
            }
            
            // Check super admin on sign in
            if (event === 'SIGNED_IN' && authUser.email) {
              await checkAndPromoteSuperAdmin(authUser.email)
            }
            
            // Always fetch the latest role
            const role = await fetchUserRole(authUser.id)
            const userWithRole: UserWithRole = {
              ...authUser,
              role: role || undefined
            }
            
            if (mounted) {
              console.log('[AUTH-CONTEXT] onAuthStateChange - Setting user:', userWithRole.email)
              setUser(userWithRole)
              setIsAdmin(role === 'admin')
              setLoading(false) // Ensure loading is set to false
              setAuthInitialized(true)
            }
            
            // Handle auth events
            if (event === 'SIGNED_IN') {
              console.log('[AUTH-CONTEXT] SIGNED_IN event - refreshing router')
              router.refresh()
            }
          } catch (error) {
            console.error('[AUTH-CONTEXT] Error in auth state change:', error)
            // Set user anyway to prevent blocking
            if (mounted) {
              setUser(authUser)
              setIsAdmin(false)
              setLoading(false) // Ensure loading is set to false
              setAuthInitialized(true) // even on error
            }
          }
        } else {
          console.log('[AUTH-CONTEXT] onAuthStateChange - No user, clearing state')
          setUser(null)
          setIsAdmin(false)
          setLoading(false) // Ensure loading is set to false when no user
          setAuthInitialized(true)
          
          if (event === 'SIGNED_OUT') {
            console.log('[AUTH-CONTEXT] SIGNED_OUT event - redirecting to login')
            router.push('/login')
          }
        }
        
        if (event === 'TOKEN_REFRESHED') {
          // Silent refresh succeeded
          console.log('[AUTH-CONTEXT] Token refreshed successfully')
        }
      }
    )

    // Set up periodic session refresh to prevent logout
    const refreshInterval = setInterval(async () => {
      console.log('[AUTH-CONTEXT] Refreshing session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('[AUTH-CONTEXT] Error refreshing session:', error)
      } else if (session) {
        console.log('[AUTH-CONTEXT] Session refreshed successfully')
      }
    }, 10 * 60 * 1000) // Refresh every 10 minutes

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [supabase, router])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  console.log('[AUTH-CONTEXT] Provider rendering. user:', user, 'loading:', loading)
  console.log('[AUTH-CONTEXT] Full auth state:', {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    loading,
    authInitialized,
    isAdmin,
    timestamp: new Date().toISOString()
  })

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isAdmin, authInitialized }}>
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