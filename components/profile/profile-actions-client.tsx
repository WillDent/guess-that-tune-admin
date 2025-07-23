'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Settings } from 'lucide-react'
import { EditProfileModal } from '@/components/profile/edit-profile-modal-stub'
import Link from 'next/link'

export function ProfileActions() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
        <Link href="/settings">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </Link>
      </div>
      
      {/* Edit Profile Modal - this will need to be updated to use server actions */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  )
}