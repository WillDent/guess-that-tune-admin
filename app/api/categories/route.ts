import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Create a public Supabase client for reading categories
    // Since categories are public (per RLS policy), we can use anon key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    console.log('[API/categories] Query result:', { 
      error,
      dataLength: categories?.length || 0 
    })

    if (error) {
      console.error('[API/categories] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(categories || [])
  } catch (err) {
    console.error('[API/categories] Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}