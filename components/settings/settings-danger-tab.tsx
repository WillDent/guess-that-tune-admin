'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { signOut } from '@/app/actions/auth'

export function SettingsDangerTab() {
  const { toast } = useToast()
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  const handleAccountDeletion = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }
    
    setDeletingAccount(true)
    try {
      // TODO: Implement account deletion
      // This would require a server-side function to properly delete all user data
      toast.error('Account deletion is not yet implemented')
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <>
      <Card className="p-6 border-red-200 dark:border-red-800">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
          <Trash2 className="h-5 w-5" />
          Delete Account
        </h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Once you delete your account, there is no going back. All your data will be permanently removed.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-confirmation"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE"
            />
          </div>
          
          <Button 
            variant="destructive"
            onClick={handleAccountDeletion}
            disabled={deletingAccount || deleteConfirmation !== 'DELETE'}
          >
            {deletingAccount ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Deleting Account...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </>
            )}
          </Button>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Sign Out</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sign out of your account on this device
        </p>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign Out
          </Button>
        </form>
      </Card>
    </>
  )
}