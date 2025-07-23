import { requireAuth } from '@/lib/auth/server'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will redirect to login if not authenticated
  await requireAuth()
  
  return <>{children}</>
}