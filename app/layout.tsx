// ABOUTME: Root layout component that wraps all pages
// ABOUTME: Sets up fonts, metadata, and global styles
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Sidebar } from "@/components/layout/sidebar"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider } from "@/hooks/use-toast"
import { LayoutClient } from "@/components/layout/layout-client"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <LayoutClient>{children}</LayoutClient>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}