// ABOUTME: Root layout component that wraps all pages
// ABOUTME: Sets up fonts, metadata, and global styles
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Sidebar } from "@/components/layout/sidebar"
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
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}