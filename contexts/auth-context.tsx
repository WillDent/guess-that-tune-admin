'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Tables']['users']['Row']['role']
type UserWithRole = User & {
  role?: UserRole
}

interface AuthContextType {
  user: UserWithRole | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
      if (!existingUser) {
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
        // Call the database function to promote user to admin
        const { error } = await supabase.rpc('promote_user_to_admin', {
          user_email: email
        })
        
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
      return data?.role || null
    } catch (err) {
      console.error('Error fetching user role:', err)
      return null
    }
  }

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        // First, try to get the user quickly
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (!mounted) return;
        
        if (authError) {
          console.error('Error getting auth user:', authError)
          setLoading(false)
          return
        }
        
        if (authUser) {
          console.log('Auth user found:', authUser.id, authUser.email)
          
          // First ensure user exists in database before setting user
          // This prevents RLS policy failures in other hooks
          try {
            await ensureUserExists(authUser)
            console.log('User row ensured in database')
            
            // Check if this user should be promoted to super admin
            if (authUser.email) {
              await checkAndPromoteSuperAdmin(authUser.email)
            }
            
            // Fetch user role
            const role = await fetchUserRole(authUser.id)
            console.log('User role fetched:', role)
            
            const userWithRole: UserWithRole = {
              ...authUser,
              role
            }
            
            if (mounted) {
              setUser(userWithRole)
              setIsAdmin(role === 'admin')
              setLoading(false)
            }
          } catch (dbError) {
            console.error('Error with database operations:', dbError)
            // Still set the user even if role fetch fails
            // This allows the app to work with basic functionality
            if (mounted) {
              setUser(authUser)
              setIsAdmin(false)
              setLoading(false)
            }
          }
        } else {
          console.log('No auth user found')
          setUser(null)
          setIsAdmin(false)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error getting user:', error)
        if (mounted) {
          setUser(null)
          setIsAdmin(false)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authUser = session?.user ?? null
        
        if (authUser && mounted) {
          try {
            // Ensure user exists on sign in
            if (event === 'SIGNED_IN') {
              await ensureUserExists(authUser)
              console.log('User row ensured on sign in')
            }
            
            // Check super admin on sign in
            if (event === 'SIGNED_IN' && authUser.email) {
              await checkAndPromoteSuperAdmin(authUser.email)
            }
            
            // Always fetch the latest role
            const role = await fetchUserRole(authUser.id)
            const userWithRole: UserWithRole = {
              ...authUser,
              role
            }
            
            if (mounted) {
              setUser(userWithRole)
              setIsAdmin(role === 'admin')
            }
            
            // Handle auth events
            if (event === 'SIGNED_IN') {
              router.refresh()
            }
          } catch (error) {
            console.error('Error in auth state change:', error)
            // Set user anyway to prevent blocking
            if (mounted) {
              setUser(authUser)
              setIsAdmin(false)
            }
          }
        } else {
          setUser(null)
          setIsAdmin(false)
          
          if (event === 'SIGNED_OUT') {
            router.push('/login')
          }
        }
        
        if (event === 'TOKEN_REFRESHED') {
          // Silent refresh succeeded
          console.log('Token refreshed successfully')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isAdmin }}>
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