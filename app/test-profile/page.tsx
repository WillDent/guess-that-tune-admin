'use client'

import { useProfile } from '@/hooks/use-profile'

export default function TestProfilePage() {
  const { profile, stats, loading, error } = useProfile()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Profile Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Error:</strong> {error ? error.message : 'None'}
        </div>
        
        <div>
          <strong>Profile:</strong> {profile ? profile.email : 'Not loaded'}
        </div>
        
        <div>
          <strong>Stats:</strong>
          <pre>{JSON.stringify(stats, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}