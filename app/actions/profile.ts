'use server'

import { requireAuth } from '@/lib/auth/server'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(updates: {
  email_notifications?: boolean
  is_public?: boolean
  name?: string
  bio?: string
  location?: string
  website?: string
  twitter_handle?: string
}) {
  const user = await requireAuth()
  const supabase = await createServerClient()
  
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
  
  if (error) {
    throw new Error('Failed to update profile')
  }
  
  revalidatePath('/profile')
  revalidatePath('/settings')
  
  return { success: true }
}