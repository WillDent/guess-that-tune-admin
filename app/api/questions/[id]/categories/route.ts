import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'

// NOTE: Next.js App Router API routes do not support a second argument for params.
// Dynamic params must be extracted from the URL.
export async function GET(req: NextRequest) {
  // Extract id from the URL pathname
  const pathname = new URL(req.url).pathname;
  // /api/questions/{id}/categories
  const match = pathname.match(/\/api\/questions\/([^/]+)\/categories/);
  const questionSetId = match ? match[1] : undefined;
  console.log('[API] GET /api/questions/[id]/categories', questionSetId)
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('question_set_categories')
      .select('category_id, categories(name)')
      .eq('question_set_id', questionSetId)
    if (error) {
      console.error('[API] GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // Map to { category_id, category_name }
    const result = (data || []).map((row: any) => ({
      category_id: row.category_id,
      category_name: row.categories?.name || ''
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error('[API] GET exception:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Extract id from the URL pathname
  const pathname = new URL(req.url).pathname;
  // /api/questions/{id}/categories
  const match = pathname.match(/\/api\/questions\/([^/]+)\/categories/);
  const questionSetId = match ? match[1] : undefined;
  console.log('[API] POST /api/questions/[id]/categories', questionSetId)
  try {
    const supabase = await createServerClient()
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('[API] POST user fetch error:', userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }
    if (!user) {
      console.error('[API] POST: No authenticated user')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const body = await req.json()
    const { categoryIds } = body
    if (!Array.isArray(categoryIds)) {
      return NextResponse.json({ error: 'categoryIds must be an array' }, { status: 400 })
    }
    // Remove all existing assignments
    const { error: delError } = await supabase
      .from('question_set_categories')
      .delete()
      .eq('question_set_id', questionSetId)
    if (delError) {
      console.error('[API] POST delete error:', delError)
      return NextResponse.json({ error: delError.message }, { status: 500 })
    }
    // Insert new assignments
    if (categoryIds.length > 0) {
      const inserts = categoryIds.map((catId: string) => ({
        question_set_id: questionSetId,
        category_id: catId
      }))
      const { error: insError } = await supabase
        .from('question_set_categories')
        .insert(inserts)
      if (insError) {
        console.error('[API] POST insert error:', insError)
        return NextResponse.json({ error: insError.message }, { status: 500 })
      }
    }
    // Return updated assignments
    const { data, error } = await supabase
      .from('question_set_categories')
      .select('category_id, categories(name)')
      .eq('question_set_id', questionSetId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const result = (data || []).map((row: any) => ({
      category_id: row.category_id,
      category_name: row.categories?.name || ''
    }))
    return NextResponse.json(result)
  } catch (err) {
    console.error('[API] POST exception:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
} 