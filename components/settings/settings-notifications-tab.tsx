'use client'

import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Bell } from 'lucide-react'
import { updateUserProfile } from '@/app/actions/profile'
import { useToast } from '@/hooks/use-toast'

interface SettingsNotificationsTabProps {
  emailNotifications: boolean
}

export function SettingsNotificationsTab({ emailNotifications }: SettingsNotificationsTabProps) {
  const { toast } = useToast()

  const handleEmailNotificationChange = async (checked: boolean) => {
    try {
      await updateUserProfile({ email_notifications: checked })
      toast.success('Notification preferences updated')
    } catch (error) {
      toast.error('Failed to update preferences')
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5" />
        Notification Preferences
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-gray-500">
              Receive updates about your games and question sets
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={handleEmailNotificationChange}
          />
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="game-invites">Game Invitations</Label>
            <p className="text-sm text-gray-500">
              Get notified when someone invites you to a game
            </p>
          </div>
          <Switch
            id="game-invites"
            defaultChecked={true}
            disabled
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="weekly-summary">Weekly Summary</Label>
            <p className="text-sm text-gray-500">
              Receive a weekly summary of your activity
            </p>
          </div>
          <Switch
            id="weekly-summary"
            defaultChecked={false}
            disabled
          />
        </div>
      </div>
    </Card>
  )
}