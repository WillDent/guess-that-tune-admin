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
  const { state, user, error, isAdmin, loading } = useAuth()
  const [showStateMachine, setShowStateMachine] = useState(false)
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const getStateIcon = () => {
    switch (state) {
      case AUTH_STATES.INITIAL:
        return <Loader2 className="h-4 w-4 animate-spin" />
      case AUTH_STATES.AUTHENTICATING:
        return <Loader2 className="h-4 w-4 animate-spin" />
      case AUTH_STATES.AUTHENTICATED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case AUTH_STATES.UNAUTHENTICATED:
        return <XCircle className="h-4 w-4 text-gray-400" />
      case AUTH_STATES.REFRESHING:
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case AUTH_STATES.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getStateBadgeVariant = () => {
    switch (state) {
      case AUTH_STATES.AUTHENTICATED:
        return 'default'
      case AUTH_STATES.ERROR:
        return 'destructive'
      case AUTH_STATES.UNAUTHENTICATED:
        return 'secondary'
      default:
        return 'outline'
    }
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

            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600">
                <span className="font-medium">Error:</span> {error.message}
              </div>
            )}

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