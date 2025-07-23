'use client'

import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Shield } from 'lucide-react'
import { updateUserProfile } from '@/app/actions/profile'
import { useToast } from '@/hooks/use-toast'

interface SettingsPrivacyTabProps {
  isPublic: boolean
}

export function SettingsPrivacyTab({ isPublic }: SettingsPrivacyTabProps) {
  const { toast } = useToast()

  const handlePublicProfileChange = async (checked: boolean) => {
    try {
      await updateUserProfile({ is_public: checked })
      toast.success('Privacy settings updated')
    } catch (error) {
      toast.error('Failed to update privacy settings')
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Privacy Settings
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="public-profile">Public Profile</Label>
            <p className="text-sm text-gray-500">
              Allow others to see your profile and public question sets
            </p>
          </div>
          <Switch
            id="public-profile"
            checked={isPublic}
            onCheckedChange={handlePublicProfileChange}
          />
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="show-stats">Show Statistics</Label>
            <p className="text-sm text-gray-500">
              Display your game statistics on your profile
            </p>
          </div>
          <Switch
            id="show-stats"
            defaultChecked={true}
            disabled
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="show-activity">Show Activity</Label>
            <p className="text-sm text-gray-500">
              Let others see your recent game activity
            </p>
          </div>
          <Switch
            id="show-activity"
            defaultChecked={true}
            disabled
          />
        </div>
      </div>
    </Card>
  )
}