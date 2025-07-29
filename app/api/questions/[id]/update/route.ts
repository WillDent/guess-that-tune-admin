import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PUT(req: NextRequest) {
  // Extract id from the URL pathname
  const pathname = new URL(req.url).pathname;
  const match = pathname.match(/\/api\/questions\/([^/]+)\/update/);
  const questionSetId = match ? match[1] : undefined;
  
  console.log('[API] PUT /api/questions/[id]/update', questionSetId)
  
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('[API] PUT user error:', userError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const body = await req.json()
    const { updates, questions } = body
    
    // Update question set
    const updateData = { ...updates }
    
    // If questions are being updated, update the question_count
    if (questions) {
      updateData.question_count = questions.length
    }
    
    const { error: updateError } = await supabase
      .from('question_sets')
      .update(updateData)
      .eq('id', questionSetId)
      .eq('user_id', user.id)
    
    if (updateError) {
      console.error('[API] PUT update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    // If questions provided, replace all questions
    if (questions) {
      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('question_set_id', questionSetId)
      
      if (deleteError) {
        console.error('[API] PUT delete error:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
      
      // Insert new questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map((q: any) => ({
          ...q,
          question_set_id: questionSetId
        }))
        
        const { error: insertError } = await supabase
          .from('questions')
          .insert(questionsToInsert)
        
        if (insertError) {
          console.error('[API] PUT insert error:', insertError)
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API] PUT exception:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}