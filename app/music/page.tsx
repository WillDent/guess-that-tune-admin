import { requireAuth } from '@/lib/auth/server'
import { MusicBrowserClient } from '@/components/music/music-browser-client'

export default async function MusicPage() {
  // Ensure user is authenticated
  await requireAuth()
  
  // The music browser needs to stay client-side due to:
  // - Real-time search functionality
  // - Apple Music API integration
  // - Complex state management for cart
  // - Audio preview playback
  
  return <MusicBrowserClient />
}