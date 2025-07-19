'use client'

import { useState, useEffect } from 'react'

export default function TestHealthPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [directFetch, setDirectFetch] = useState<any>(null)
  const [directQuery, setDirectQuery] = useState<any>(null)

  useEffect(() => {
    // Test our health check endpoint
    const testHealth = async () => {
      try {
        const response = await fetch('/api/health-check')
        const data = await response.json()
        setHealthStatus(data)
      } catch (err) {
        setHealthStatus({ error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }
    
    // Test direct fetch to Supabase
    const testDirect = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!url || !key) {
          setDirectFetch({ error: 'Missing environment variables' })
          return
        }
        
        const response = await fetch(`${url}/rest/v1/`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          }
        })
        
        setDirectFetch({
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        })
      } catch (err) {
        setDirectFetch({ error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }
    
    // Test direct REST API query
    const testDirectQuery = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        const response = await fetch(`${url}/rest/v1/users?select=*&limit=1`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          }
        })
        
        const text = await response.text()
        
        setDirectQuery({
          status: response.status,
          statusText: response.statusText,
          data: text
        })
      } catch (err) {
        setDirectQuery({ error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }
    
    testHealth()
    testDirect()
    testDirectQuery()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Health Check Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">API Health Check:</h2>
          <pre className="text-sm">{JSON.stringify(healthStatus, null, 2)}</pre>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Direct Supabase Fetch:</h2>
          <pre className="text-sm">{JSON.stringify(directFetch, null, 2)}</pre>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Direct REST Query:</h2>
          <pre className="text-sm">{JSON.stringify(directQuery, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}