'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

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
    if (SUPER_ADMIN_EMAIL && email === SUPER_ADMIN_EMAIL) {
      try {
        // Update user role directly to admin
        const { error } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('email', email)
        
        if (error) {
          console.error('Error promoting super admin:', error)
        } else {
          console.log('[AUTH-CONTEXT] Promoted super admin:', email)
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
      console.log('[AUTH-CONTEXT] Fetching role for user:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching user role:', error.message, error.code, error.details)
        // If it's an RLS error or row not found, return null instead of throwing
        if (error.code === 'PGRST116' || error.code === '42501') {
          return null
        }
        throw error
      }
      
      console.log('[AUTH-CONTEXT] User role data:', data)
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
      return
    }
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        // First try to get session (lighter weight)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('[AUTH-CONTEXT] Session error:', sessionError)
          setLoading(false)
          setAuthInitialized(true)
          return
        }
        
        if (!session) {
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
        // Set basic user state but keep loading true until role is fetched
        if (mounted) {
          setUser(sessionUser)
          setAuthInitialized(true)
          // Don't set loading to false yet - wait until role is fetched
        }
        
        // Then try to enhance with database operations in the background
        try {
          await ensureUserExists(sessionUser)
          
          // Check if this user should be promoted to super admin
          if (sessionUser.email) {
            await checkAndPromoteSuperAdmin(sessionUser.email)
          }
          
          // Fetch user role
          const role = await fetchUserRole(sessionUser.id)
          
          const userWithRole: UserWithRole = {
            ...sessionUser,
            role: role || undefined
          }
          
          // Check if this is the super admin email
          const isSuperAdmin = sessionUser.email === SUPER_ADMIN_EMAIL
          
          if (mounted) {
            console.log('[AUTH-CONTEXT] Setting user with role:', { 
              email: sessionUser.email, 
              role, 
              isAdmin: role === 'admin' || isSuperAdmin,
              isSuperAdmin,
              superAdminEmail: SUPER_ADMIN_EMAIL,
              emailMatch: sessionUser.email === SUPER_ADMIN_EMAIL,
              roleFromDB: role
            })
            setUser(userWithRole)
            setIsAdmin(role === 'admin' || isSuperAdmin)
            setLoading(false)
          }
        } catch (dbError) {
          console.error('[AUTH-CONTEXT] Error with database operations:', dbError)
          // User is already set, just log the error
          if (mounted) {
            setLoading(false)
          }
        }
      } else {
        if (mounted) {
          setUser(null)
          setIsAdmin(false)
          setLoading(false)
          setAuthInitialized(true)
        }
      }
      } catch (error) {
        console.error('[AUTH-CONTEXT] Error getting initial session:', error)
        if (mounted) {
          setUser(null)
          setIsAdmin(false)
          setLoading(false)
          setAuthInitialized(true)
        }
      }
    }

    getInitialSession()
    
    // Fallback timeout to ensure we always set initialized
    const initTimeout = setTimeout(() => {
      if (!authInitialized && mounted) {
        console.warn('[AUTH-CONTEXT] Fallback: Setting initialized after timeout')
        setLoading(false)
        setAuthInitialized(true)
      }
    }, 30000) // 30 second fallback - increased to prevent premature logout

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authUser = session?.user ?? null
        
        if (authUser && mounted) {
          // Immediately set user to prevent loading hang
          setUser(authUser)
          setLoading(false)
          setAuthInitialized(true)
          
          try {
            // Ensure user exists on sign in
            if (event === 'SIGNED_IN') {
              await ensureUserExists(authUser)
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
            
            // Check if this is the super admin email
            const isSuperAdmin = authUser.email === SUPER_ADMIN_EMAIL
            
            if (mounted) {
              console.log('[AUTH-CONTEXT] Auth state change - Setting user with role:', { 
                email: authUser.email, 
                role, 
                isAdmin: role === 'admin' || isSuperAdmin,
                isSuperAdmin,
                superAdminEmail: SUPER_ADMIN_EMAIL,
                emailMatch: authUser.email === SUPER_ADMIN_EMAIL,
                roleFromDB: role
              })
              setUser(userWithRole)
              setIsAdmin(role === 'admin' || isSuperAdmin)
              setLoading(false) // Ensure loading is set to false
              setAuthInitialized(true)
            }
            
            // Handle auth events
            if (event === 'SIGNED_IN') {
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
          setUser(null)
          setIsAdmin(false)
          setLoading(false) // Ensure loading is set to false when no user
          setAuthInitialized(true)
          
          if (event === 'SIGNED_OUT') {
            router.push('/login')
          }
        }
      }
    )

    // Set up periodic session refresh to prevent logout
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('[AUTH-CONTEXT] Error refreshing session:', error)
        } else if (session) {
          // Session is still valid, refresh the auth token if needed
          const { error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error('[AUTH-CONTEXT] Error refreshing auth token:', refreshError)
          }
        }
      } catch (err) {
        console.error('[AUTH-CONTEXT] Unexpected error during session refresh:', err)
      }
    }, 5 * 60 * 1000) // Refresh every 5 minutes

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearInterval(refreshInterval)
      clearTimeout(initTimeout)
    }
  }, [supabase, router])

  const signOut = async () => {
    try {
      console.log('[AUTH-CONTEXT] Starting sign out...')
      
      // Set loading state to prevent re-renders during sign out
      setLoading(true)
      
      // Clear user state immediately
      setUser(null)
      setIsAdmin(false)
      
      // Create a timeout promise - reduced to 2 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timed out after 2 seconds')), 2000)
      })
      
      // Race between signOut and timeout
      try {
        await Promise.race([
          supabase.auth.signOut(),
          timeoutPromise
        ])
        console.log('[AUTH-CONTEXT] Sign out successful via SDK')
      } catch (timeoutError) {
        console.log('[AUTH-CONTEXT] SDK sign out timed out, using fallback...')
        
        // If SDK times out, clear local storage and redirect
        if (typeof window !== 'undefined') {
          // Clear all auth-related items from localStorage
          const keysToRemove = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key))
          
          // Clear session storage too
          const sessionKeysToRemove = []
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
              sessionKeysToRemove.push(key)
            }
          }
          sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
        }
      }
      
      console.log('[AUTH-CONTEXT] Local auth cleared')
      
      // Force a hard refresh to the login page
      if (typeof window !== 'undefined') {
        // Clear any remaining session data
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Force redirect with a full page reload
        window.location.replace('/login');
      }
      
    } catch (error) {
      console.error('[AUTH-CONTEXT] Error signing out:', error)
      // Even if there's an error, try to redirect using window.location
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

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