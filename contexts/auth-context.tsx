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
        .single()
      
      if (error) throw error
      return data?.role || null
    } catch (err) {
      console.error('Error fetching user role:', err)
      return null
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          // Check if this user should be promoted to super admin
          if (authUser.email) {
            await checkAndPromoteSuperAdmin(authUser.email)
          }
          
          // Fetch user role
          const role = await fetchUserRole(authUser.id)
          const userWithRole: UserWithRole = {
            ...authUser,
            role
          }
          
          setUser(userWithRole)
          setIsAdmin(role === 'admin')
        } else {
          setUser(null)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authUser = session?.user ?? null
        
        if (authUser) {
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
          
          setUser(userWithRole)
          setIsAdmin(role === 'admin')
          
          // Handle auth events
          if (event === 'SIGNED_IN') {
            router.refresh()
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

    return () => subscription.unsubscribe()
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