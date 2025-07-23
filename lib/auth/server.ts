import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { Database } from '@/lib/supabase/database.types'

type User = Database['public']['Tables']['users']['Row']

/**
 * Get the current authenticated user from the server
 * This function is cached per request
 */
export const getUser = cache(async () => {
  const supabase = await createServerClient()
  
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authUser) {
    return null
  }
  
  // Get full user profile with role
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()
    
  if (userError || !user) {
    console.error('Error fetching user profile:', userError)
    return null
  }
  
  return user
})

/**
 * Get the current session from the server
 * This function is cached per request
 */
export const getSession = cache(async () => {
  const supabase = await createServerClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  
  return session
})

/**
 * Require authentication for a server component or action
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

/**
 * Require admin role for a server component or action
 * Redirects to home if not admin
 */
export async function requireAdmin() {
  const user = await requireAuth()
  
  if (user.role !== 'admin') {
    redirect('/')
  }
  
  return user
}

/**
 * Check if the current user is an admin
 * Returns false if not authenticated
 */
export async function isAdmin() {
  const user = await getUser()
  return user?.role === 'admin'
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createServerClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
  
  redirect('/login')
}

/**
 * Get auth headers for API routes
 * Returns null if not authenticated
 */
export async function getAuthHeaders() {
  const session = await getSession()
  
  if (!session) {
    return null
  }
  
  return {
    Authorization: `Bearer ${session.access_token}`,
  }
}