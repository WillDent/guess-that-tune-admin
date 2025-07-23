'use server'

import { requireAdmin } from '@/lib/auth/server'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRole: 'admin' | 'user') {
  const currentUser = await requireAdmin()
  const supabase = await createServerClient()
  
  // Prevent self-demotion
  if (currentUser.id === userId && newRole === 'user') {
    throw new Error('Cannot demote yourself')
  }
  
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)
  
  if (error) {
    throw new Error('Failed to update user role')
  }
  
  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateUserStatus(userId: string, action: 'suspend' | 'activate') {
  const currentUser = await requireAdmin()
  const supabase = await createServerClient()
  
  // Prevent self-suspension
  if (currentUser.id === userId && action === 'suspend') {
    throw new Error('Cannot suspend yourself')
  }
  
  const updates = action === 'suspend' 
    ? { 
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspended_by: currentUser.id
      }
    : { 
        status: 'active',
        suspended_at: null,
        suspended_by: null
      }
  
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
  
  if (error) {
    throw new Error('Failed to update user status')
  }
  
  revalidatePath('/admin/users')
  return { success: true }
}