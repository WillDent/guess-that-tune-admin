'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function TestRLSPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testCreateOwnGame = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('games')
        .insert({
          name: `RLS Test Game ${Date.now()}`,
          host_user_id: user?.id,
          question_set_id: 'test-id',
          status: 'waiting'
        })
        .select()
        .single()

      if (error) {
        addResult(`❌ Create own game failed: ${error.message}`)
        toast.error('Failed to create game')
      } else {
        addResult(`✅ Created game: ${data.id}`)
        toast.success('Game created successfully')
        
        // Clean up
        await supabase.from('games').delete().eq('id', data.id)
      }
    } catch (err) {
      addResult(`❌ Unexpected error: ${err}`)
    }
    setLoading(false)
  }

  const testCreateOtherUserGame = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('games')
        .insert({
          name: `RLS Violation Test ${Date.now()}`,
          host_user_id: 'different-user-id', // Not the current user!
          question_set_id: 'test-id',
          status: 'waiting'
        })
        .select()

      if (error) {
        addResult(`✅ RLS blocked creating game for another user: ${error.code}`)
        toast.success('RLS working correctly - blocked unauthorized creation')
      } else {
        addResult(`❌ SECURITY VIOLATION: Created game with different host!`)
        toast.error('Security violation - RLS not working!')
      }
    } catch (err) {
      addResult(`❌ Unexpected error: ${err}`)
    }
    setLoading(false)
  }

  const testViewOwnGames = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('host_user_id', user!.id)

      if (error) {
        addResult(`❌ Failed to view own games: ${error.message}`)
      } else {
        addResult(`✅ Can view ${data.length} of your own games`)
      }
    } catch (err) {
      addResult(`❌ Unexpected error: ${err}`)
    }
    setLoading(false)
  }

  const testViewAllGames = async () => {
    setLoading(true)
    try {
      const { data: allGames, error: allError } = await supabase
        .from('games')
        .select('*')

      const { data: myGames, error: myError } = await supabase
        .from('games')
        .select('*')
        .or(`host_user_id.eq.${user!.id},id.in.(select game_id from game_participants where user_id='${user!.id}')`)

      if (allError || myError) {
        addResult(`❌ Error fetching games`)
      } else {
        if (allGames.length === myGames.length) {
          addResult(`✅ RLS working: Can only see ${allGames.length} games (your games + participating)`)
        } else {
          addResult(`⚠️  Seeing ${allGames.length} total games, but only involved in ${myGames.length}`)
        }
      }
    } catch (err) {
      addResult(`❌ Unexpected error: ${err}`)
    }
    setLoading(false)
  }

  const clearResults = () => setResults([])

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">RLS Testing</h1>
          <p>Please log in to test Row Level Security policies.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">RLS Testing Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Test Row Level Security policies to ensure proper access control.
          Logged in as: <strong>{user.email}</strong>
        </p>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={testCreateOwnGame} 
              disabled={loading}
              variant="default"
            >
              Test: Create Own Game ✅
            </Button>
            
            <Button 
              onClick={testCreateOtherUserGame} 
              disabled={loading}
              variant="destructive"
            >
              Test: Create Game for Another User ❌
            </Button>
            
            <Button 
              onClick={testViewOwnGames} 
              disabled={loading}
              variant="default"
            >
              Test: View Own Games
            </Button>
            
            <Button 
              onClick={testViewAllGames} 
              disabled={loading}
              variant="default"
            >
              Test: View All Games (RLS Filter)
            </Button>
          </div>

          <Button 
            onClick={clearResults} 
            variant="outline"
            className="w-full"
          >
            Clear Results
          </Button>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">Test Results:</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click a button above to start testing.</p>
          ) : (
            <div className="space-y-1 font-mono text-sm">
              {results.map((result, index) => (
                <div key={index} className={
                  result.includes('✅') ? 'text-green-600' :
                  result.includes('❌') ? 'text-red-600' :
                  'text-yellow-600'
                }>
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Expected Results:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Can create games where you are the host</li>
            <li>✅ Cannot create games with a different host</li>
            <li>✅ Can only view games you host or participate in</li>
            <li>✅ Cannot update/delete games you don't host</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}