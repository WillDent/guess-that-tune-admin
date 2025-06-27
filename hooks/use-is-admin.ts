'use client'

import { useAuth } from '@/contexts/auth-context'

/**
 * Hook to check if the current user is an admin
 * @returns {object} Object containing isAdmin boolean and loading state
 */
export function useIsAdmin() {
  const { user, loading, isAdmin } = useAuth()

  return {
    isAdmin,
    loading,
    user
  }
}