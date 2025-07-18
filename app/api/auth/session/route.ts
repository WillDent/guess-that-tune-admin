import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      console.error('[SESSION-API] No session found:', error)
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }
    
    console.log('[SESSION-API] Successfully got session for user:', session.user.id)
    return NextResponse.json({ 
      token: session.access_token,
      userId: session.user.id 
    })
  } catch (error) {
    console.error('[SESSION-API] Error:', error)
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
  }
}