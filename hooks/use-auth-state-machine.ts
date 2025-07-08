'use client'

import { useReducer, useCallback, useEffect } from 'react'
import {
  AuthStateMachine,
  AuthEvent,
  AUTH_EVENTS,
  AUTH_STATES,
  createAuthStateMachine,
  transition,
  isAuthenticated,
  isLoading,
  getStateLabel
} from '@/lib/auth/auth-state-machine'
import type { UserWithRole } from '@/utils/supabase/auth'

// Reducer for state machine
function authReducer(
  state: AuthStateMachine,
  action: { type: AuthEvent; payload?: any }
): AuthStateMachine {
  return transition(state, action.type, action.payload)
}

export function useAuthStateMachine() {
  const [machine, dispatch] = useReducer(authReducer, undefined, createAuthStateMachine)

  // Event dispatchers
  const initialize = useCallback(() => {
    dispatch({ type: AUTH_EVENTS.INITIALIZE })
  }, [])

  const loginStart = useCallback(() => {
    dispatch({ type: AUTH_EVENTS.LOGIN_START })
  }, [])

  const loginSuccess = useCallback((user: UserWithRole) => {
    dispatch({ type: AUTH_EVENTS.LOGIN_SUCCESS, payload: user })
  }, [])

  const loginFailure = useCallback((error: Error) => {
    dispatch({ type: AUTH_EVENTS.LOGIN_FAILURE, payload: error })
  }, [])

  const logout = useCallback(() => {
    dispatch({ type: AUTH_EVENTS.LOGOUT })
  }, [])

  const refreshStart = useCallback(() => {
    dispatch({ type: AUTH_EVENTS.REFRESH_START })
  }, [])

  const refreshSuccess = useCallback((user: UserWithRole) => {
    dispatch({ type: AUTH_EVENTS.REFRESH_SUCCESS, payload: user })
  }, [])

  const refreshFailure = useCallback((error: Error) => {
    dispatch({ type: AUTH_EVENTS.REFRESH_FAILURE, payload: error })
  }, [])

  const sessionExpired = useCallback(() => {
    dispatch({ type: AUTH_EVENTS.SESSION_EXPIRED })
  }, [])

  // Debug helper
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Auth State Machine] State: ${machine.state} (${getStateLabel(machine.state)})`)
    }
  }, [machine.state])

  return {
    // State and context
    state: machine.state,
    context: machine.context,
    user: machine.context.user,
    error: machine.context.error,
    isAdmin: machine.context.isAdmin,
    
    // Computed states
    isAuthenticated: isAuthenticated(machine.state),
    isLoading: isLoading(machine.state),
    isInitializing: machine.state === AUTH_STATES.INITIAL,
    
    // Event dispatchers
    events: {
      initialize,
      loginStart,
      loginSuccess,
      loginFailure,
      logout,
      refreshStart,
      refreshSuccess,
      refreshFailure,
      sessionExpired
    }
  }
}