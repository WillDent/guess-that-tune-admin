'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"
import { ToastContainer } from "@/components/ui/toast"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { OfflineIndicator } from "@/components/ui/offline-indicator"
import { MigrationPrompt } from "@/components/migration/migration-prompt"
import { CartIcon } from "@/components/cart/cart-icon"
import { CartSidebar } from "@/components/cart/cart-sidebar"
import { AuthDebug } from "@/components/debug/auth-debug"

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToast()
  const pathname = usePathname()
  const [isCartOpen, setIsCartOpen] = useState(false)
  
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
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-64">
          <Sidebar />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="lg:hidden bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
              <MobileNav />
              <h1 className="text-lg font-semibold text-gray-900">Guess That Tune</h1>
              <CartIcon onClick={() => setIsCartOpen(true)} />
            </div>
          </header>
          
          {/* Desktop header - only shows cart icon */}
          <header className="hidden lg:flex bg-white shadow-sm border-b border-gray-200">
            <div className="flex-1 px-4 sm:px-6 py-4 flex items-center justify-end">
              <CartIcon onClick={() => setIsCartOpen(true)} />
            </div>
          </header>
          
          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <OfflineIndicator />
      <MigrationPrompt />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <AuthDebug />
    </>
  )
}