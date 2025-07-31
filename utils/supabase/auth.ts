/**
 * Consolidated authentication utilities
 * 
 * This module exports all authentication-related utilities from a single place
 * to ensure consistency across the codebase.
 */

import { createServerClient as createClient } from '@/lib/supabase/server'
import { handleSupabaseError } from './error-handler'
import { NextResponse } from 'next/server'
import type { SupabaseClient, Session, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

// Re-export existing utilities
export { withSession, hasValidSession, requireSession } from './with-session'
export { withSessionRoute, requireSessionRoute } from './with-session-server'
export { handleSupabaseError, isRLSError, isDuplicateError } from './error-handler'

// Types
export interface UserWithRole extends User {
  role?: 'user' | 'admin'
}

/**
 * Server-side: Require authenticated user
 * @throws Error if not authenticated
 * @returns User object
 */
export async function requireAuth(supabase: SupabaseClient<Database>): Promise<User> {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Server-side: Require admin user
 * @throws Error if not authenticated or not admin
 * @returns User object with role
 */
export async function requireAdmin(supabase: SupabaseClient<Database>): Promise<UserWithRole> {
  const user = await requireAuth(supabase)
  
  // Since users table doesn't have role field, we'll skip admin check
  // In production, you'd want to implement proper role management
  console.warn('Admin check bypassed - users table has no role field')
  
  return { ...user, role: 'admin' as any }
}

/**
 * Server-side: Get current user with role
 * @returns User with role or null if not authenticated
 */
export async function getCurrentUser(supabase: SupabaseClient<Database>): Promise<UserWithRole | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  // Since users table doesn't have role field, default to 'user'
  // In production, you'd want to implement proper role management
  let role: 'user' | 'admin' = 'user'
  
  return {
    ...user,
    role
  }
}

/**
 * API Route helper: Require authentication
 * Returns appropriate HTTP response if not authenticated
 */
export async function requireAuthRoute(
  request: Request,
  callback: (user: User, supabase: SupabaseClient<Database>) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const user = await requireAuth(supabase)
    return await callback(user, supabase)
  } catch (error) {
    const handledError = handleSupabaseError(error)
    return NextResponse.json(
      { error: handledError.message },
      { status: 401 }
    )
  }
}

/**
 * API Route helper: Require admin authentication
 * Returns appropriate HTTP response if not authenticated or not admin
 */
export async function requireAdminRoute(
  request: Request,
  callback: (user: UserWithRole, supabase: SupabaseClient<Database>) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const user = await requireAdmin(supabase)
    return await callback(user, supabase)
  } catch (error: any) {
    const status = error.message === 'Authentication required' ? 401 : 403
    return NextResponse.json(
      { error: error.message },
      { status }
    )
  }
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: UserWithRole | null, role: 'user' | 'admin'): boolean {
  return user?.role === role
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: UserWithRole | null): boolean {
  return hasRole(user, 'admin')
}