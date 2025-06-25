'use client'

import { useState, useEffect } from 'react'
import { X, Database, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  checkForLocalStorageData, 
  getMigrationStatus,
  getLocalStorageData,
  getMigrationSummary
} from '@/utils/migration/detector'
import { MigrationModal } from './migration-modal'
import { useAuth } from '@/contexts/auth-context'

export function MigrationPrompt() {
  const { user } = useAuth()
  const [showPrompt, setShowPrompt] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [migrationData, setMigrationData] = useState<ReturnType<typeof getMigrationSummary> | null>(null)
  
  useEffect(() => {
    if (!user) return
    
    // Check if migration has already been done
    const { hasMigrated } = getMigrationStatus()
    if (hasMigrated) return
    
    // Check for localStorage data
    if (checkForLocalStorageData()) {
      const data = getLocalStorageData()
      const summary = getMigrationSummary(data)
      setMigrationData(summary)
      setShowPrompt(summary.hasData)
    }
  }, [user])
  
  const handleDismiss = () => {
    setShowPrompt(false)
    // Remember dismissal for this session
    sessionStorage.setItem('migrationPromptDismissed', 'true')
  }
  
  useEffect(() => {
    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem('migrationPromptDismissed')
    if (dismissed === 'true') {
      setShowPrompt(false)
    }
  }, [])
  
  if (!showPrompt || !migrationData) return null
  
  return (
    <>
      <Alert className="fixed bottom-4 right-4 max-w-md shadow-lg border-blue-200 bg-blue-50">
        <Database className="h-5 w-5 text-blue-600" />
        <AlertDescription className="pr-8">
          <div className="space-y-2">
            <p className="font-medium text-blue-900">
              Local data detected
            </p>
            <p className="text-sm text-blue-700">
              We found {migrationData.questionSets.count} question set{migrationData.questionSets.count !== 1 ? 's' : ''} 
              {migrationData.games.count > 0 && ` and ${migrationData.games.count} game${migrationData.games.count !== 1 ? 's' : ''}`} 
              {' '}stored locally. Would you like to migrate this data to your account?
            </p>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Database className="h-4 w-4 mr-2" />
                Migrate Data
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
                className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
              >
                Not Now
              </Button>
            </div>
          </div>
        </AlertDescription>
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-blue-600 hover:text-blue-800"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
      
      {showModal && (
        <MigrationModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setShowPrompt(false)
          }}
        />
      )}
    </>
  )
}