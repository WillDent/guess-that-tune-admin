import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = await createServerClient()
  
  // Get all cookies
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies.filter(c => c.name.includes('sb-') || c.name.includes('auth'))
  
  // Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Get user role from database if user exists
  let userRole = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    userRole = profile?.role
  }
  
  return NextResponse.json({
    cookies: {
      total: allCookies.length,
      authCookies: authCookies.map(c => ({ name: c.name, value: c.value ? 'present' : 'missing' }))
    },
    session: {
      exists: !!session,
      user: session?.user?.email,
      error: sessionError?.message
    },
    user: {
      exists: !!user,
      email: user?.email,
      id: user?.id,
      role: userRole,
      error: userError?.message
    },
    environment: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPER_ADMIN_EMAIL: process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
    }
  })
}