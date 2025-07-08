/**
 * Auth State Machine
 * 
 * A lightweight state machine for managing authentication states
 * without external dependencies.
 */

import type { User } from '@supabase/supabase-js'
import type { UserWithRole } from '@/utils/supabase/auth'

// Auth States
export const AUTH_STATES = {
  INITIAL: 'initial',
  AUTHENTICATING: 'authenticating',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  REFRESHING: 'refreshing',
  ERROR: 'error'
} as const

export type AuthState = typeof AUTH_STATES[keyof typeof AUTH_STATES]

// Auth Events
export const AUTH_EVENTS = {
  INITIALIZE: 'INITIALIZE',
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_START: 'REFRESH_START',
  REFRESH_SUCCESS: 'REFRESH_SUCCESS',
  REFRESH_FAILURE: 'REFRESH_FAILURE',
  SESSION_EXPIRED: 'SESSION_EXPIRED'
} as const

export type AuthEvent = typeof AUTH_EVENTS[keyof typeof AUTH_EVENTS]

// Auth Context
export interface AuthContext {
  user: UserWithRole | null
  error: Error | null
  isAdmin: boolean
}

// State Machine Configuration
export interface AuthStateMachine {
  state: AuthState
  context: AuthContext
}

// State Transitions
type StateTransition = {
  [key in AuthState]: {
    [event in AuthEvent]?: AuthState
  }
}

const transitions: StateTransition = {
  [AUTH_STATES.INITIAL]: {
    [AUTH_EVENTS.INITIALIZE]: AUTH_STATES.AUTHENTICATING,
  },
  
  [AUTH_STATES.AUTHENTICATING]: {
    [AUTH_EVENTS.LOGIN_SUCCESS]: AUTH_STATES.AUTHENTICATED,
    [AUTH_EVENTS.LOGIN_FAILURE]: AUTH_STATES.UNAUTHENTICATED,
  },
  
  [AUTH_STATES.AUTHENTICATED]: {
    [AUTH_EVENTS.LOGOUT]: AUTH_STATES.UNAUTHENTICATED,
    [AUTH_EVENTS.REFRESH_START]: AUTH_STATES.REFRESHING,
    [AUTH_EVENTS.SESSION_EXPIRED]: AUTH_STATES.UNAUTHENTICATED,
  },
  
  [AUTH_STATES.UNAUTHENTICATED]: {
    [AUTH_EVENTS.LOGIN_START]: AUTH_STATES.AUTHENTICATING,
  },
  
  [AUTH_STATES.REFRESHING]: {
    [AUTH_EVENTS.REFRESH_SUCCESS]: AUTH_STATES.AUTHENTICATED,
    [AUTH_EVENTS.REFRESH_FAILURE]: AUTH_STATES.UNAUTHENTICATED,
  },
  
  [AUTH_STATES.ERROR]: {
    [AUTH_EVENTS.INITIALIZE]: AUTH_STATES.AUTHENTICATING,
    [AUTH_EVENTS.LOGIN_START]: AUTH_STATES.AUTHENTICATING,
  }
}

// Context Updates
type ContextUpdater = (
  context: AuthContext,
  payload?: any
) => AuthContext

const contextUpdaters: Partial<Record<AuthEvent, ContextUpdater>> = {
  [AUTH_EVENTS.LOGIN_SUCCESS]: (context, user: UserWithRole) => ({
    ...context,
    user,
    error: null,
    isAdmin: user.role === 'admin'
  }),
  
  [AUTH_EVENTS.LOGIN_FAILURE]: (context, error: Error) => ({
    ...context,
    user: null,
    error,
    isAdmin: false
  }),
  
  [AUTH_EVENTS.LOGOUT]: () => ({
    user: null,
    error: null,
    isAdmin: false
  }),
  
  [AUTH_EVENTS.REFRESH_SUCCESS]: (context, user: UserWithRole) => ({
    ...context,
    user,
    error: null,
    isAdmin: user.role === 'admin'
  }),
  
  [AUTH_EVENTS.SESSION_EXPIRED]: (context) => ({
    ...context,
    user: null,
    isAdmin: false
  })
}

// State Machine Functions
export function createAuthStateMachine(): AuthStateMachine {
  return {
    state: AUTH_STATES.INITIAL,
    context: {
      user: null,
      error: null,
      isAdmin: false
    }
  }
}

export function transition(
  machine: AuthStateMachine,
  event: AuthEvent,
  payload?: any
): AuthStateMachine {
  const currentState = machine.state
  const nextState = transitions[currentState]?.[event]
  
  if (!nextState) {
    console.warn(`No transition defined for event ${event} in state ${currentState}`)
    return machine
  }
  
  // Update context if updater exists
  const contextUpdater = contextUpdaters[event]
  const nextContext = contextUpdater 
    ? contextUpdater(machine.context, payload)
    : machine.context
  
  return {
    state: nextState,
    context: nextContext
  }
}

// Helper functions
export function canTransition(
  currentState: AuthState,
  event: AuthEvent
): boolean {
  return !!transitions[currentState]?.[event]
}

export function getAvailableEvents(state: AuthState): AuthEvent[] {
  const stateTransitions = transitions[state]
  return stateTransitions ? Object.keys(stateTransitions) as AuthEvent[] : []
}

// State Selectors
export const isAuthenticated = (state: AuthState) => 
  state === AUTH_STATES.AUTHENTICATED || state === AUTH_STATES.REFRESHING

export const isLoading = (state: AuthState) => 
  state === AUTH_STATES.INITIAL || 
  state === AUTH_STATES.AUTHENTICATING || 
  state === AUTH_STATES.REFRESHING

export const isError = (state: AuthState) => 
  state === AUTH_STATES.ERROR

// Debug Helpers
export function getStateLabel(state: AuthState): string {
  const labels: Record<AuthState, string> = {
    [AUTH_STATES.INITIAL]: 'Initializing',
    [AUTH_STATES.AUTHENTICATING]: 'Authenticating',
    [AUTH_STATES.AUTHENTICATED]: 'Authenticated',
    [AUTH_STATES.UNAUTHENTICATED]: 'Not Authenticated',
    [AUTH_STATES.REFRESHING]: 'Refreshing Session',
    [AUTH_STATES.ERROR]: 'Error'
  }
  return labels[state] || state
}

export function visualizeStateMachine(): string {
  const lines: string[] = ['Auth State Machine:']
  lines.push('==================')
  
  Object.entries(transitions).forEach(([state, events]) => {
    lines.push(`\n${state}:`)
    Object.entries(events).forEach(([event, nextState]) => {
      lines.push(`  ${event} -> ${nextState}`)
    })
  })
  
  return lines.join('\n')
}