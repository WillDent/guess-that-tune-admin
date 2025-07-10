'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient as createClient } from '@/lib/supabase/server'
import { AuthError } from '@/lib/errors/types'

export async function signIn(email: string, password: string, redirectTo?: string) {
  console.log('[AUTH-ACTION] Sign in attempt for:', email)
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[AUTH-ACTION] Sign in error:', error.message)
    return { error: error.message }
  }

  console.log('[AUTH-ACTION] Sign in successful')
  console.log('[AUTH-ACTION] Session:', data.session ? 'Present' : 'Missing')
  
  // Verify the session was properly set
  const { data: { session } } = await supabase.auth.getSession()
  console.log('[AUTH-ACTION] Session check after login:', session ? 'Present' : 'Missing')

  // Force a revalidation of all data
  revalidatePath('/', 'layout')
  
  // Return success and let the client handle the redirect
  return { success: true, redirectTo: redirectTo || '/' }
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your email to confirm your account' }
}

export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function signInWithMagicLink(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your email for the login link!' }
}