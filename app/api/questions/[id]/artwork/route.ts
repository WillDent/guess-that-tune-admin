import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { errorHandler } from '@/lib/errors/handler'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { artworkUrl } = await request.json()
    
    if (!artworkUrl) {
      return NextResponse.json(
        { error: 'Artwork URL is required' },
        { status: 400 }
      )
    }

    // Check if user owns the question set
    const { data: questionSet, error: fetchError } = await supabase
      .from('question_sets')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !questionSet) {
      return NextResponse.json(
        { error: 'Question set not found' },
        { status: 404 }
      )
    }

    if (questionSet.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own question sets' },
        { status: 403 }
      )
    }

    // Update the question set with the artwork URL
    const { error: updateError } = await supabase
      .from('question_sets')
      .update({ 
        artwork_url: artworkUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('[ARTWORK-UPDATE] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}