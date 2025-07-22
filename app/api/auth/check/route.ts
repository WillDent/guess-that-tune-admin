import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ 
        authenticated: false, 
        error: error?.message || 'No user found' 
      })
    }
    
    // Get user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role || 'user'
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}