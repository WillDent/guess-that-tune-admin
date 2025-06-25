'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Trash2,
  AlertCircle,
  Check,
  Mail,
  Key,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useProfile } from '@/hooks/use-profile'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { profile, updateProfile, loading } = useProfile()
  const { toast } = useToast()
  const supabase = createClient()
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Account deletion state
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  
  // Email change state
  const [newEmail, setNewEmail] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    setChangingPassword(true)
    try {
      // First verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      })
      
      if (signInError) {
        toast.error('Current password is incorrect')
        return
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    } finally {
      setChangingPassword(false)
    }
  }
  
  const handleEmailChange = async () => {
    if (!newEmail) {
      toast.error('Please enter a new email address')
      return
    }
    
    if (newEmail === user?.email) {
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
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
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
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

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handlePasswordChange}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                >
                  {changingPassword ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6 mt-6">
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
                    checked={profile?.email_notifications ?? true}
                    onCheckedChange={async (checked) => {
                      await updateProfile({ email_notifications: checked })
                    }}
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
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6 mt-6">
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
                    checked={profile?.is_public ?? true}
                    onCheckedChange={async (checked) => {
                      await updateProfile({ is_public: checked })
                    }}
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
          </TabsContent>

          {/* Danger Zone */}
          <TabsContent value="danger" className="space-y-6 mt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                These actions are permanent and cannot be undone. Please proceed with caution.
              </AlertDescription>
            </Alert>
            
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
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}