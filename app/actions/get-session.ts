'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getSessionToken() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      console.error('[GET-SESSION-ACTION] No session found:', error)
      return { error: 'No session found', token: null }
    }
    
    console.log('[GET-SESSION-ACTION] Successfully got session')
    return { error: null, token: session.access_token }
  } catch (error) {
    console.error('[GET-SESSION-ACTION] Error:', error)
    return { error: 'Failed to get session', token: null }
  }
}