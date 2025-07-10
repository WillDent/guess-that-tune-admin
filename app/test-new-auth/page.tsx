'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TestNewAuthPage() {
  const [email, setEmail] = useState('will@dent.ly')
  const [password, setPassword] = useState('Odessa99!')
  const [status, setStatus] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setStatus('Logging in...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setStatus(`Error: ${error.message}`)
      return
    }

    setStatus('Login successful! Checking session...')
    
    // Check session immediately
    const { data: { session } } = await supabase.auth.getSession()
    setStatus(`Session: ${session ? 'Active' : 'Not found'}`)
    
    // Navigate to questions after a moment
    setTimeout(() => {
      router.push('/questions')
    }, 2000)
  }

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()
    
    setStatus(`Session: ${session ? 'Active' : 'None'}, User: ${user?.email || 'None'}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold">Test New Auth</h1>
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full px-3 py-2 border rounded"
        />
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-3 py-2 border rounded"
        />
        
        <div className="flex gap-2">
          <button
            onClick={handleLogin}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
          
          <button
            onClick={checkAuth}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Check Auth
          </button>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-sm font-mono">{status || 'Ready'}</p>
        </div>
      </div>
    </div>
  )
}