'use client'

import { useAuth } from '@/contexts/auth-context'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AUTH_STATES, 
  getStateLabel,
  visualizeStateMachine 
} from '@/lib/auth/auth-state-machine'
import { 
  User, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react'
import { useState } from 'react'

export function AuthStateDebugger() {
  const { user, isAdmin, loading } = useAuth()
  const [showStateMachine, setShowStateMachine] = useState(false)
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // TODO: Integrate with auth state machine when it's connected to auth context
  const state = user ? AUTH_STATES.AUTHENTICATED : AUTH_STATES.UNAUTHENTICATED
  const error = null

  const getStateIcon = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (user) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <XCircle className="h-4 w-4 text-gray-400" />
  }

  const getStateBadgeVariant = () => {
    if (user) {
      return 'default'
    }
    return 'secondary'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="p-4 shadow-lg max-w-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Auth State Machine</h3>
            <Badge variant={getStateBadgeVariant()}>
              <span className="flex items-center gap-1">
                {getStateIcon()}
                {getStateLabel(state)}
              </span>
            </Badge>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span className="font-medium">User:</span>
              <span className={user ? 'text-green-600' : 'text-gray-400'}>
                {user ? user.email : 'None'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Role:</span>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs">
                {isAdmin ? 'Admin' : 'User'}
              </Badge>
            </div>


            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowStateMachine(!showStateMachine)}
                className="w-full text-xs"
              >
                {showStateMachine ? 'Hide' : 'Show'} State Machine Diagram
              </Button>
            </div>

            {showStateMachine && (
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-64 overflow-y-auto">
                {visualizeStateMachine()}
              </pre>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}