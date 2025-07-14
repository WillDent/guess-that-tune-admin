import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Check if we're in the browser
          if (typeof document === 'undefined') {
            return undefined
          }
          
          // Get cookie value from document.cookie
          const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1]
          
          return cookieValue
        },
        set(name: string, value: string, options?: any) {
          // Check if we're in the browser
          if (typeof document === 'undefined') {
            return
          }
          
          // Set cookie with proper options
          const cookieOptions = []
          cookieOptions.push(`${name}=${value}`)
          cookieOptions.push('path=/')
          
          if (options?.maxAge) {
            cookieOptions.push(`max-age=${options.maxAge}`)
          }
          if (options?.domain) {
            cookieOptions.push(`domain=${options.domain}`)
          }
          if (options?.sameSite) {
            cookieOptions.push(`samesite=${options.sameSite}`)
          }
          if (options?.secure) {
            cookieOptions.push('secure')
          }
          
          document.cookie = cookieOptions.join('; ')
        },
        remove(name: string, options?: any) {
          // Check if we're in the browser
          if (typeof document === 'undefined') {
            return
          }
          
          // Remove cookie by setting expiry in the past
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
        }
      },
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        storageKey: 'sb-auth-token',
        flowType: 'pkce'
      },
      global: {
        headers: {
          'x-application-name': 'guess-that-tune-admin'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        enabled: false
      }
    }
  )
}