import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { errorHandler } from '@/lib/errors/handler'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (you may want to add proper admin check)
    if (user.email !== 'will@dent.ly') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Find all question sets with OpenAI URLs
    const { data: brokenSets, error: fetchError } = await supabase
      .from('question_sets')
      .select('id, artwork_url')
      .like('artwork_url', '%oaidalleapiprodscus.blob.core.windows.net%')

    if (fetchError) {
      throw fetchError
    }

    console.log(`[FIX-ARTWORK] Found ${brokenSets?.length || 0} question sets with OpenAI URLs`)

    // Update them to null (or you could set a default image)
    if (brokenSets && brokenSets.length > 0) {
      const updates = brokenSets.map(set => ({
        id: set.id,
        artwork_url: null // Remove broken URLs
      }))

      // Batch update
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('question_sets')
          .update({ artwork_url: update.artwork_url })
          .eq('id', update.id)

        if (updateError) {
          console.error(`[FIX-ARTWORK] Failed to update ${update.id}:`, updateError)
        }
      }

      return NextResponse.json({
        message: `Fixed ${brokenSets.length} question sets with broken artwork URLs`,
        fixedIds: brokenSets.map(s => s.id)
      })
    }

    return NextResponse.json({
      message: 'No broken artwork URLs found'
    })

  } catch (error) {
    console.error('[FIX-ARTWORK] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}