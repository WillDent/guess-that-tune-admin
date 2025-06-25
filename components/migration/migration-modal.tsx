'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Gamepad2,
  ChevronRight,
  Clock,
  HardDrive
} from 'lucide-react'
import { 
  getLocalStorageData, 
  getMigrationSummary,
  validateLocalData,
  setMigrationStatus,
  type MigrationSummary
} from '@/utils/migration/detector'
import { MigrationService, type MigrationStep } from '@/services/migration'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

interface MigrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MigrationModal({ isOpen, onClose }: MigrationModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [step, setStep] = useState<'preview' | 'migrating' | 'complete'>('preview')
  const [migrationSteps, setMigrationSteps] = useState<MigrationStep[]>([])
  const [migrationSummary, setMigrationSummary] = useState<MigrationSummary | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [currentProgress, setCurrentProgress] = useState(0)
  
  useEffect(() => {
    if (isOpen) {
      // Load and validate data
      const data = getLocalStorageData()
      const summary = getMigrationSummary(data)
      const validation = validateLocalData(data)
      
      setMigrationSummary(summary)
      setValidationErrors(validation.errors)
    }
  }, [isOpen])
  
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  
  const handleStartMigration = async () => {
    if (!user) return
    
    setStep('migrating')
    
    const migrationService = new MigrationService((step) => {
      setMigrationSteps(prev => {
        const newSteps = [...prev]
        const index = newSteps.findIndex(s => s.name === step.name)
        if (index >= 0) {
          newSteps[index] = step
        } else {
          newSteps.push(step)
        }
        
        // Calculate progress
        const completed = newSteps.filter(s => s.status === 'completed').length
        const total = newSteps.length
        setCurrentProgress((completed / total) * 100)
        
        return newSteps
      })
    })
    
    const data = getLocalStorageData()
    const result = await migrationService.migrate(user.id, data)
    
    setMigrationResult(result)
    setStep('complete')
    
    if (result.success) {
      // Mark migration as complete
      setMigrationStatus(true)
      
      // Clear localStorage data
      const keys = ['questionSets', 'games', 'userPreferences']
      keys.forEach(key => localStorage.removeItem(key))
      
      toast.success('Migration completed successfully!')
    } else {
      toast.error('Migration completed with errors')
    }
  }
  
  const handleClose = () => {
    if (step === 'migrating') {
      // Don't allow closing during migration
      return
    }
    onClose()
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {step === 'preview' && 'Data Migration Preview'}
            {step === 'migrating' && 'Migrating Your Data'}
            {step === 'complete' && 'Migration Complete'}
          </DialogTitle>
          <DialogDescription>
            {step === 'preview' && 'Review your local data before migrating to your account'}
            {step === 'migrating' && 'Please wait while we transfer your data'}
            {step === 'complete' && 'Your data has been successfully migrated'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'preview' && migrationSummary && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium">Question Sets</h3>
                </div>
                <p className="text-2xl font-bold">{migrationSummary.questionSets.count}</p>
                <p className="text-sm text-gray-500">
                  {migrationSummary.questionSets.totalQuestions} total questions
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gamepad2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium">Games</h3>
                </div>
                <p className="text-2xl font-bold">{migrationSummary.games.count}</p>
                <p className="text-sm text-gray-500">
                  {migrationSummary.games.completed} completed
                </p>
              </div>
            </div>
            
            {/* Details Tabs */}
            <Tabs defaultValue="sets" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sets">Question Sets</TabsTrigger>
                <TabsTrigger value="info">Migration Info</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sets" className="mt-4">
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  <div className="space-y-2">
                    {migrationSummary.questionSets.names.map((name, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{name}</span>
                      </div>
                    ))}
                    {migrationSummary.questionSets.count > 5 && (
                      <p className="text-sm text-gray-500 italic mt-2">
                        And {migrationSummary.questionSets.count - 5} more...
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Estimated time: {migrationSummary.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-gray-400" />
                    <span>Data size: {formatBytes(migrationSummary.totalSize)}</span>
                  </div>
                </div>
                
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Validation Issues:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="space-y-1 text-sm">
                      <li>• Your original data will be removed after successful migration</li>
                      <li>• Private question sets will remain private</li>
                      <li>• Game history will be preserved for reference</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
            
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleStartMigration}
                disabled={!migrationSummary.hasData}
              >
                Start Migration
              </Button>
            </div>
          </div>
        )}
        
        {step === 'migrating' && (
          <div className="space-y-6 py-4">
            <Progress value={currentProgress} className="h-2" />
            
            <div className="space-y-3">
              {migrationSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  {step.status === 'pending' && (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                  {step.status === 'in_progress' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  )}
                  {step.status === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {step.status === 'failed' && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {step.status === 'skipped' && (
                    <div className="h-5 w-5 rounded-full bg-gray-200" />
                  )}
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.name}</p>
                    {step.error && (
                      <p className="text-xs text-red-600 mt-1">{step.error}</p>
                    )}
                    {step.itemsProcessed !== undefined && step.totalItems !== undefined && (
                      <p className="text-xs text-gray-500 mt-1">
                        {step.itemsProcessed} / {step.totalItems} items
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center text-sm text-gray-500">
              Please do not close this window during migration
            </p>
          </div>
        )}
        
        {step === 'complete' && migrationResult && (
          <div className="space-y-4">
            {migrationResult.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription>
                  <p className="font-medium text-green-900">Migration successful!</p>
                  <div className="mt-2 space-y-1 text-sm text-green-700">
                    <p>• {migrationResult.summary.questionSetsMigrated} question sets migrated</p>
                    <p>• {migrationResult.summary.questionsMigrated} questions migrated</p>
                    <p>• {migrationResult.summary.gamesMigrated} games migrated</p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Migration completed with errors</p>
                  {migrationResult.summary.errors.length > 0 && (
                    <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                      {migrationResult.summary.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={onClose}>
                {migrationResult.success ? 'Done' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}