import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const supabase = await createServerClient()
    
    // Get all unique tags from question_sets
    const { data, error } = await supabase
      .from('question_sets')
      .select('tags')
      .not('tags', 'is', null)
    
    if (error) {
      console.error('[POPULAR-TAGS] Error fetching tags:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Extract and count unique tags
    const tagCounts = new Map<string, number>()
    
    data?.forEach(row => {
      if (row.tags && Array.isArray(row.tags)) {
        row.tags.forEach(tag => {
          if (typeof tag === 'string') {
            const count = tagCounts.get(tag) || 0
            tagCounts.set(tag, count + 1)
          }
        })
      }
    })
    
    // Sort by usage count and return top tags
    const popularTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }))
    
    return NextResponse.json({ tags: popularTags })
    
  } catch (err) {
    console.error('[POPULAR-TAGS] Exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}