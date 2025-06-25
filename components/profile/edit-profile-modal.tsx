'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Camera, 
  Loader2, 
  AlertCircle,
  Check,
  X,
  Upload,
  Trash2
} from 'lucide-react'
import { useProfile } from '@/hooks/use-profile'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { debounce } from 'lodash'
import type { Database } from '@/lib/supabase/database.types'

type UserProfile = Database['public']['Tables']['users']['Row'] & {
  bio?: string | null
  location?: string | null
  website?: string | null
  twitter_handle?: string | null
  is_public?: boolean
  email_notifications?: boolean
}

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile
}

export function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
  const { updateProfile, uploadAvatar, deleteAvatar, checkUsernameAvailability, updating } = useProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [username, setUsername] = useState(profile.username || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [location, setLocation] = useState(profile.location || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [twitterHandle, setTwitterHandle] = useState(profile.twitter_handle || '')
  const [isPublic, setIsPublic] = useState(profile.is_public ?? true)
  const [emailNotifications, setEmailNotifications] = useState(profile.email_notifications ?? true)
  
  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  // Username validation
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState(false)
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile.display_name || '')
      setUsername(profile.username || '')
      setBio(profile.bio || '')
      setLocation(profile.location || '')
      setWebsite(profile.website || '')
      setTwitterHandle(profile.twitter_handle || '')
      setIsPublic(profile.is_public ?? true)
      setEmailNotifications(profile.email_notifications ?? true)
      setAvatarPreview(null)
      setUsernameError(null)
      setUsernameAvailable(false)
    }
  }, [isOpen, profile])
  
  // Debounced username check
  useEffect(() => {
    if (!username || username === profile.username) {
      setUsernameError(null)
      setUsernameAvailable(false)
      return
    }
    
    const checkUsername = debounce(async () => {
      setCheckingUsername(true)
      const { available, error } = await checkUsernameAvailability(username)
      setUsernameAvailable(available)
      setUsernameError(error)
      setCheckingUsername(false)
    }, 500)
    
    checkUsername()
    
    return () => checkUsername.cancel()
  }, [username, profile.username, checkUsernameAvailability])
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUsernameError('Please select an image file')
      return
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUsernameError('Image size must be less than 5MB')
      return
    }
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  const handleAvatarUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    
    setUploadingAvatar(true)
    const { url, error } = await uploadAvatar(file)
    
    if (!error && url) {
      setAvatarPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    
    setUploadingAvatar(false)
  }
  
  const handleAvatarDelete = async () => {
    if (!profile.avatar_url) return
    
    setUploadingAvatar(true)
    await deleteAvatar()
    setUploadingAvatar(false)
  }
  
  const handleSave = async () => {
    // Validate username if changed
    if (username !== profile.username && (usernameError || !usernameAvailable)) {
      return
    }
    
    // Upload avatar if changed
    if (avatarPreview && fileInputRef.current?.files?.[0]) {
      await handleAvatarUpload()
    }
    
    // Update profile
    const { error } = await updateProfile({
      display_name: displayName || undefined,
      username: username || undefined,
      bio: bio || undefined,
      location: location || undefined,
      website: website || undefined,
      twitter_handle: twitterHandle || undefined,
      is_public: isPublic,
      email_notifications: emailNotifications
    })
    
    if (!error) {
      onClose()
    }
  }
  
  const hasChanges = 
    displayName !== (profile.display_name || '') ||
    username !== (profile.username || '') ||
    bio !== (profile.bio || '') ||
    location !== (profile.location || '') ||
    website !== (profile.website || '') ||
    twitterHandle !== (profile.twitter_handle || '') ||
    isPublic !== (profile.is_public ?? true) ||
    emailNotifications !== (profile.email_notifications ?? true) ||
    avatarPreview !== null
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={avatarPreview || profile.avatar_url || undefined} 
                  alt={displayName || profile.email || ''} 
                />
                <AvatarFallback className="text-2xl">
                  {getInitials(displayName || profile.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full p-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              
              <div className="flex gap-2">
                {avatarPreview && (
                  <Button
                    size="sm"
                    onClick={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                )}
                
                {profile.avatar_url && !avatarPreview && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleAvatarDelete}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Remove
                  </Button>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                Recommended: Square image, at least 400x400px, max 5MB
              </p>
            </div>
          </div>
          
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
              maxLength={50}
            />
            <p className="text-xs text-gray-500">{displayName.length}/50 characters</p>
          </div>
          
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="johndoe"
                maxLength={20}
                className={usernameError ? 'border-red-500' : usernameAvailable ? 'border-green-500' : ''}
              />
              {checkingUsername && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
              )}
              {!checkingUsername && username && username !== profile.username && (
                <>
                  {usernameAvailable && (
                    <Check className="absolute right-3 top-3 h-4 w-4 text-green-600" />
                  )}
                  {usernameError && (
                    <X className="absolute right-3 top-3 h-4 w-4 text-red-600" />
                  )}
                </>
              )}
            </div>
            {usernameError && (
              <p className="text-xs text-red-600">{usernameError}</p>
            )}
            <p className="text-xs text-gray-500">
              3-20 characters, letters, numbers and underscores only
            </p>
          </div>
          
          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">{bio.length}/200 characters</p>
          </div>
          
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
              maxLength={50}
            />
          </div>
          
          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          
          {/* Twitter */}
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter Handle</Label>
            <Input
              id="twitter"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value.replace('@', ''))}
              placeholder="johndoe"
              maxLength={15}
            />
          </div>
          
          {/* Privacy Settings */}
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
                onCheckedChange={setIsPublic}
              />
            </div>
            
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
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </div>
          
          {/* Error Alert */}
          {usernameError && username !== profile.username && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{usernameError}</AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={updating}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || updating || (username !== profile.username && !!usernameError)}
          >
            {updating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}