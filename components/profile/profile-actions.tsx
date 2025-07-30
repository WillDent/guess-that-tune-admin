'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Edit } from 'lucide-react'
import { EditProfileModal } from './edit-profile-modal'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/client'

interface ProfileActionsProps {
  userId: string
}

export function ProfileActions({ userId }: ProfileActionsProps) {
  const { user } = useAuth()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const isOwnProfile = user?.id === userId
  
  if (!isOwnProfile) {
    return null
  }
  
  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </Button>
      </div>
      
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  )
}