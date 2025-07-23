import { requireAuth } from '@/lib/auth/server'
import { createServerClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  User,
  Lock,
  Bell,
  Shield,
  Trash2,
  AlertCircle,
  ArrowLeft,
  Database
} from 'lucide-react'
import Link from 'next/link'
import { SettingsAccountTab } from '@/components/settings/settings-account-tab'
import { SettingsPasswordTab } from '@/components/settings/settings-password-tab'
import { SettingsNotificationsTab } from '@/components/settings/settings-notifications-tab'
import { SettingsPrivacyTab } from '@/components/settings/settings-privacy-tab'
import { SettingsDangerTab } from '@/components/settings/settings-danger-tab'

async function getUserProfile(userId: string) {
  const supabase = await createServerClient()
  
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return profile
}

export default async function SettingsPage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/profile">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6 mt-6">
          <SettingsAccountTab user={user} />
          <SettingsPasswordTab />
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <SettingsNotificationsTab 
            emailNotifications={profile?.email_notifications ?? true} 
          />
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6 mt-6">
          <SettingsPrivacyTab 
            isPublic={profile?.is_public ?? true} 
          />
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="space-y-6 mt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These actions are permanent and cannot be undone. Please proceed with caution.
            </AlertDescription>
          </Alert>
          
          <SettingsDangerTab />
          
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Migration
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Migrate your locally stored data to your account
            </p>
            <Link href="/settings/migration">
              <Button variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Manage Migration
              </Button>
            </Link>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}