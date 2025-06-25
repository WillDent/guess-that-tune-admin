'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  FileText, 
  Gamepad2, 
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react'
import { 
  checkForLocalStorageData,
  getLocalStorageData,
  getMigrationSummary,
  getMigrationStatus,
  type MigrationSummary
} from '@/utils/migration/detector'
import { MigrationModal } from '@/components/migration/migration-modal'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function MigrationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasLocalData, setHasLocalData] = useState(false)
  const [migrationSummary, setMigrationSummary] = useState<MigrationSummary | null>(null)
  const [migrationStatus, setMigrationStatus] = useState<{ hasMigrated: boolean; timestamp?: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  useEffect(() => {
    checkMigrationStatus()
  }, [])
  
  const checkMigrationStatus = () => {
    setLoading(true)
    
    // Check migration status
    const status = getMigrationStatus()
    setMigrationStatus(status)
    
    // Check for local data
    const hasData = checkForLocalStorageData()
    setHasLocalData(hasData)
    
    if (hasData) {
      const data = getLocalStorageData()
      const summary = getMigrationSummary(data)
      setMigrationSummary(summary)
    }
    
    setLoading(false)
  }
  
  const formatDate = (timestamp?: string) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Database className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-gray-600">Please sign in to manage data migration</p>
              <Button onClick={() => router.push('/login')}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Data Migration</h1>
        <p className="text-gray-600 mt-2">
          Migrate your locally stored data to your account
        </p>
      </div>
      
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Migration Status
            <Button
              size="sm"
              variant="ghost"
              onClick={checkMigrationStatus}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {migrationStatus?.hasMigrated ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  {migrationStatus?.hasMigrated ? 'Migration Completed' : 'No Migration History'}
                </p>
                <p className="text-sm text-gray-500">
                  Last migration: {formatDate(migrationStatus?.timestamp)}
                </p>
              </div>
            </div>
            {migrationStatus?.hasMigrated && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Completed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Local Data Detection */}
      {hasLocalData && migrationSummary ? (
        <Card>
          <CardHeader>
            <CardTitle>Local Data Found</CardTitle>
            <CardDescription>
              We detected data stored locally in your browser
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Data Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Question Sets</span>
                </div>
                <p className="text-2xl font-bold">{migrationSummary.questionSets.count}</p>
                <p className="text-sm text-gray-500">
                  {migrationSummary.questionSets.totalQuestions} questions total
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gamepad2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Games</span>
                </div>
                <p className="text-2xl font-bold">{migrationSummary.games.count}</p>
                <p className="text-sm text-gray-500">
                  {migrationSummary.games.completed} completed
                </p>
              </div>
            </div>
            
            {/* Migration Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Migration will transfer all your local data to your account. This process is safe and your data will be preserved.
              </AlertDescription>
            </Alert>
            
            {/* Action */}
            <div className="flex justify-end">
              <Button onClick={() => setShowModal(true)}>
                <Database className="h-4 w-4 mr-2" />
                Start Migration
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Database className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">No Local Data Found</p>
                <p className="text-sm text-gray-500 mt-1">
                  All your data is already stored in your account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Migration Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Migration is a one-time process that transfers all your local data to the cloud</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Your question sets and games will be preserved exactly as they were</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>After migration, your data will be accessible from any device when you sign in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Local storage will be cleared after successful migration to prevent duplicates</span>
            </li>
          </ul>
        </CardContent>
      </Card>
      
      {/* Migration Modal */}
      {showModal && (
        <MigrationModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            checkMigrationStatus()
          }}
        />
      )}
    </div>
  )
}