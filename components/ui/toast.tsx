'use client'

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Toast as ToastType, ToastVariant } from '@/hooks/use-toast'

interface ToastProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-background border',
  success: 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800',
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
  error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
  info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
}

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-md rounded-lg shadow-lg overflow-hidden',
        'animate-in slide-in-from-top-full',
        variantStyles[toast.variant]
      )}
    >
      <div className="flex-1 p-4">
        <div className="flex items-start">
          {variantIcons[toast.variant] && (
            <div className="flex-shrink-0 mr-3">
              {variantIcons[toast.variant]}
            </div>
          )}
          <div className="flex-1">
            {toast.title && (
              <p className="text-sm font-semibold mb-1">{toast.title}</p>
            )}
            <p className="text-sm">{toast.description}</p>
          </div>
        </div>
      </div>
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(toast.id)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }: {
  toasts: ToastType[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 pointer-events-none max-w-md w-full">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}