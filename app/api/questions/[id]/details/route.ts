import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  // Extract id from the URL pathname
  const pathname = new URL(req.url).pathname;
  const match = pathname.match(/\/api\/questions\/([^/]+)\/details/);
  const questionSetId = match ? match[1] : undefined;
  
  console.log('[API] GET /api/questions/[id]/details', questionSetId)
  
  if (!questionSetId) {
    return NextResponse.json({ error: 'Question set ID is required' }, { status: 400 })
  }
  
  try {
    const supabase = await createServerClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('[API] User fetch error:', userError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Fetch question set with a timeout wrapper
    const fetchWithTimeout = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      try {
        // First fetch the question set
        const { data: questionSet, error: setError } = await supabase
          .from('question_sets')
          .select('*')
          .eq('id', questionSetId)
          .single()
          
        if (setError || !questionSet) {
          throw setError || new Error('Question set not found')
        }
        
        // Check ownership
        if (questionSet.user_id !== user.id) {
          throw new Error('Unauthorized: You do not own this question set')
        }
        
        // Then fetch the questions separately
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('question_set_id', questionSetId)
          .order('order_index', { ascending: true })
          
        if (questionsError) {
          throw questionsError
        }
        
        // Fetch categories assigned to this question set
        const { data: categories, error: categoriesError } = await supabase
          .from('question_set_categories')
          .select(`
            category_id,
            categories (
              id,
              name,
              description,
              icon,
              color,
              display_order
            )
          `)
          .eq('question_set_id', questionSetId)
          
        if (categoriesError) {
          console.error('[API] Categories fetch error:', categoriesError)
          // Don't throw, just log - categories are optional
        }
        
        clearTimeout(timeoutId)
        
        // Combine the data
        return {
          ...questionSet,
          questions: questions || [],
          categories: categories?.map(c => c.categories).filter(Boolean) || []
        }
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    }
    
    const data = await fetchWithTimeout()
    return NextResponse.json(data)
    
  } catch (err: any) {
    console.error('[API] GET exception:', err)
    
    if (err.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    
    if (err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}