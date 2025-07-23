'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Separator } from '@/components/ui/separator'

interface SettingsAccountTabProps {
  user: {
    id: string
    email?: string
  }
}

export function SettingsAccountTab({ user }: SettingsAccountTabProps) {
  const { toast } = useToast()
  const supabase = createClient()
  
  const [newEmail, setNewEmail] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

  const handleEmailChange = async () => {
    if (!newEmail) {
      toast.error('Please enter a new email address')
      return
    }
    
    if (newEmail === user.email) {
      toast.error('This is already your email address')
      return
    }
    
    setChangingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })
      
      if (error) throw error
      
      toast.success('Verification email sent to your new address')
      setNewEmail('')
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email')
    } finally {
      setChangingEmail(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <User className="h-5 w-5" />
        Account Information
      </h2>
      
      <div className="space-y-4">
        <div>
          <Label>Email Address</Label>
          <p className="text-sm text-gray-600 mt-1">{user.email}</p>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="font-medium">Change Email</h3>
          <div className="space-y-2">
            <Label htmlFor="new-email">New Email Address</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="newemail@example.com"
            />
          </div>
          <Button 
            onClick={handleEmailChange}
            disabled={changingEmail || !newEmail}
          >
            {changingEmail ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Sending Verification...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Change Email
              </>
            )}
          </Button>
          <p className="text-sm text-gray-500">
            You'll need to verify your new email address
          </p>
        </div>
      </div>
    </Card>
  )
}