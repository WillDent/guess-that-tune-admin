'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  title?: string
  description: string
  variant: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((newToast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    const toastWithId: Toast = {
      ...newToast,
      id,
      duration: newToast.duration ?? 5000
    }

    setToasts(prev => [...prev, toastWithId])

    // Auto dismiss after duration
    if (toastWithId.duration && toastWithId.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, toastWithId.duration)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  const { toast: baseToast, ...rest } = context

  const toast = {
    default: (description: string, title?: string) =>
      baseToast({ description, title, variant: 'default' }),
    success: (description: string, title?: string) =>
      baseToast({ description, title, variant: 'success' }),
    error: (description: string, title?: string) =>
      baseToast({ description, title, variant: 'error' }),
    warning: (description: string, title?: string) =>
      baseToast({ description, title, variant: 'warning' }),
    info: (description: string, title?: string) =>
      baseToast({ description, title, variant: 'info' }),
  }

  return { toast, ...rest }
}