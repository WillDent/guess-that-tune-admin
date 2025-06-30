import { AuthError } from '@/lib/errors/types'

/**
 * Throws if not authenticated. Returns user object if authenticated.
 */
export async function requireAuth(supabase: any) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new AuthError('Authentication required')
  return user
}

/**
 * Throws if not authenticated or not admin. Returns user object if admin.
 */
export async function requireAdmin(supabase: any) {
  const user = await requireAuth(supabase)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') throw new AuthError('Admin privileges required')
  return user
} 