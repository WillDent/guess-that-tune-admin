"use client"
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client-with-singleton'

export function DebugPanel() {
  const [session, setSession] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    setCookies(document.cookie)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '50vh',
      overflow: 'auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Debug Panel</div>
      <div><b>supabase.auth.getSession():</b></div>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 4 }}>{JSON.stringify(session, null, 2)}</pre>
      <div style={{ marginTop: 8 }}><b>document.cookie:</b></div>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 4 }}>{cookies}</pre>
    </div>
  )
} 