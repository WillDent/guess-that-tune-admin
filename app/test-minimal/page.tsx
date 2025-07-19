'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function TestMinimalPage() {
  const [result, setResult] = useState<any>({ status: 'testing...' })

  useEffect(() => {
    const testMinimal = async () => {
      try {
        console.log('[MINIMAL] Creating client...')
        
        // Create a minimal Supabase client without SSR
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          }
        )
        
        console.log('[MINIMAL] Client created, attempting query...')
        
        // Set a timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, email')
            .limit(1)
            .abortSignal(controller.signal)
            
          clearTimeout(timeoutId)
          
          console.log('[MINIMAL] Query complete:', { data, error })
          setResult({ data, error })
        } catch (err) {
          clearTimeout(timeoutId)
          if (err instanceof Error && err.name === 'AbortError') {
            setResult({ error: 'Query aborted after 3 seconds' })
          } else {
            setResult({ error: err instanceof Error ? err.message : 'Unknown error' })
          }
        }
      } catch (err) {
        console.error('[MINIMAL] Error:', err)
        setResult({ error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }
    
    testMinimal()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Minimal Supabase Test</h1>
      <p className="mb-4">Testing with basic @supabase/supabase-js client (no SSR)</p>
      
      <div className="p-4 bg-gray-100 rounded">
        <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  )
}