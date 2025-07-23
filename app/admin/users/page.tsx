import { requireAdmin } from '@/lib/auth/server'
import { createServerClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'
import { AdminUserActions } from '@/components/admin/admin-user-actions'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  suspended_at: string | null
  suspended_by: string | null
  created_at: string
  updated_at: string
}

async function getUsers(): Promise<User[]> {
  const supabase = await createServerClient()
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching users:', error)
    return []
  }
  
  return users
}

function getUserStatusBadge(user: User) {
  if (user.suspended_at) {
    return <Badge variant="destructive">Suspended</Badge>
  }
  return <Badge variant="default">Active</Badge>
}

function getRoleBadge(role: string) {
  if (role === 'admin') {
    return <Badge variant="secondary">Admin</Badge>
  }
  return <Badge variant="outline">User</Badge>
}

export default async function AdminUsersPage() {
  const currentUser = await requireAdmin()
  const users = await getUsers()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user accounts, roles, and permissions
        </p>
      </div>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.name || 'Unnamed User'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {getRoleBadge(user.role)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getUserStatusBadge(user)}
                    {user.suspended_at && (
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.suspended_at), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </div>
                </TableCell>
                <TableCell>
                  {currentUser.id === user.id ? (
                    <span className="text-sm text-muted-foreground">(You)</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AdminUserActions 
                        user={user} 
                        currentUserId={currentUser.id}
                      />
                      <Link 
                        href={`/admin/activity-logs?user=${user.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Logs
                      </Link>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        Total users: {users.length} • 
        Admins: {users.filter(u => u.role === 'admin').length} • 
        Suspended: {users.filter(u => u.suspended_at).length}
      </div>
    </div>
  )
}