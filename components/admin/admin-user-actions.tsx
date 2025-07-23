'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Shield, ShieldOff, UserCheck, UserX } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { updateUserRole, updateUserStatus } from '@/app/actions/admin'

interface User {
  id: string
  email: string
  role: string
  suspended_at: string | null
}

interface AdminUserActionsProps {
  user: User
  currentUserId: string
}

export function AdminUserActions({ user, currentUserId }: AdminUserActionsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleRoleChange = async (newRole: 'admin' | 'user') => {
    setLoading(true)
    try {
      await updateUserRole(user.id, newRole)
      toast.success(`User ${newRole === 'admin' ? 'promoted to' : 'demoted from'} admin`)
    } catch (error) {
      toast.error('Failed to update user role')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (action: 'suspend' | 'activate') => {
    setLoading(true)
    try {
      await updateUserStatus(user.id, action)
      toast.success(`User ${action === 'suspend' ? 'suspended' : 'activated'}`)
    } catch (error) {
      toast.error('Failed to update user status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Role Management */}
        {user.role === 'user' ? (
          <DropdownMenuItem onClick={() => handleRoleChange('admin')}>
            <Shield className="mr-2 h-4 w-4" />
            Promote to Admin
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleRoleChange('user')}>
            <ShieldOff className="mr-2 h-4 w-4" />
            Demote to User
          </DropdownMenuItem>
        )}
        
        {/* Status Management */}
        {!user.suspended_at ? (
          <DropdownMenuItem 
            onClick={() => handleStatusChange('suspend')}
            className="text-destructive"
          >
            <UserX className="mr-2 h-4 w-4" />
            Suspend User
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleStatusChange('activate')}>
            <UserCheck className="mr-2 h-4 w-4" />
            Activate User
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}