// ABOUTME: Root layout component that wraps all pages
// ABOUTME: Sets up fonts, metadata, and global styles
import type { Metadata } from "next"
import { Sidebar } from "@/components/layout/sidebar"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider } from "@/hooks/use-toast"
import { CartProvider } from "@/contexts/cart-context"
import { LayoutClient } from "@/components/layout/layout-client"
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
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <LayoutClient>{children}</LayoutClient>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}