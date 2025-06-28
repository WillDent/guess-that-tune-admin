import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  let token = undefined
  if (typeof document !== 'undefined') {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('sb-'))
    token = cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
    console.log('[SUPABASE-CLIENT] Creating client. Cookie:', cookie, 'Token:', token)
  } else {
    console.log('[SUPABASE-CLIENT] Creating client on server. URL:', url)
  }
  return createBrowserClient<Database>(url, key, {
    cookies: {
      get(name: string) {
        if (typeof document !== 'undefined') {
          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(name + '='))
          const value = cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
          console.log('[SUPABASE-CLIENT] cookies.get', name, value)
          return value
        }
        return undefined
      },
      set(name: string, value: string, options?: any) {
        if (typeof document !== 'undefined') {
          document.cookie = `${name}=${encodeURIComponent(value)}; path=/; ${
            options?.maxAge ? `max-age=${options.maxAge};` : ''
          }`
        }
      },
      remove(name: string) {
        if (typeof document !== 'undefined') {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
      },
    },
  })
}