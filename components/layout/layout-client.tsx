'use client'

import { usePathname } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"
import { ToastContainer } from "@/components/ui/toast"
import { Sidebar } from "@/components/layout/sidebar"
import { OfflineIndicator } from "@/components/ui/offline-indicator"
import { MigrationPrompt } from "@/components/migration/migration-prompt"

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToast()
  const pathname = usePathname()
  
  // Don't show sidebar on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/signout'
  
  if (isAuthPage) {
    return (
      <>
        {children}
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
        <OfflineIndicator />
      </>
    )
  }
  
  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <OfflineIndicator />
      <MigrationPrompt />
    </>
  )
}