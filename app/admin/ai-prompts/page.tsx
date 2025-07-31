import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AIPromptsContent } from './ai-prompts-content'

export default async function AIPromptsPage() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Check if user is admin
  if (user.email !== 'will@dent.ly') {
    redirect('/questions')
  }

  // Fetch existing prompts
  const { data: prompts, error: promptsError } = await (supabase as any)
    .from('ai_artwork_prompts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Artwork Prompts</h1>
        <p className="text-gray-600">
          Manage prompt templates for AI artwork generation
        </p>
      </div>

      <AIPromptsContent 
        initialPrompts={prompts || []} 
        userId={user.id}
      />
    </div>
  )
}