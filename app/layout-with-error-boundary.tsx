// ABOUTME: Root layout component with error boundary
// ABOUTME: Example of how to add root error boundary
import type { Metadata } from "next"
import { Sidebar } from "@/components/layout/sidebar"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider } from "@/hooks/use-toast"
import { LayoutClient } from "@/components/layout/layout-client"
import { RootErrorBoundary } from "@/components/error-boundaries"
import "./globals.css"


export const metadata: Metadata = {
  title: "Guess That Tune Admin",
  description: "Admin dashboard for managing the Guess That Tune game",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <RootErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <LayoutClient>{children}</LayoutClient>
            </ToastProvider>
          </AuthProvider>
        </RootErrorBoundary>
      </body>
    </html>
  )
}