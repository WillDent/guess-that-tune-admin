import { requireAdmin } from '@/lib/auth/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will redirect to home if not admin
  await requireAdmin()
  
  return <>{children}</>
}