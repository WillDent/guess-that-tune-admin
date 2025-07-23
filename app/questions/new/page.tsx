import { requireAuth } from '@/lib/auth/server'
import { CreateQuestionSetClient } from '@/components/questions/create-question-set-client'

export default async function NewQuestionSetPage() {
  // Ensure user is authenticated
  await requireAuth()
  
  // The actual form logic needs to stay client-side due to:
  // - Session storage for selected songs
  // - Complex state management
  // - Real-time preview generation
  // - File uploads
  
  return <CreateQuestionSetClient />
}