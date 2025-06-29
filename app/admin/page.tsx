import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-pink-500" />
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
      </div>
      
      <div className="rounded-lg bg-gray-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Welcome to the Admin Panel</h2>
        <p className="text-gray-300">
          This is the admin dashboard where you can manage categories, users, and view analytics.
        </p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/categories" className="bg-gray-700 rounded-lg p-4 hover:bg-pink-900 transition-colors block">
            <h3 className="text-lg font-medium text-white mb-2">Categories</h3>
            <p className="text-gray-400">Manage question set categories</p>
          </Link>
          
          <div className="bg-gray-700 rounded-lg p-4 opacity-60 cursor-not-allowed">
            <h3 className="text-lg font-medium text-white mb-2">Users</h3>
            <p className="text-gray-400">Manage user accounts and permissions (coming soon)</p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 opacity-60 cursor-not-allowed">
            <h3 className="text-lg font-medium text-white mb-2">Analytics</h3>
            <p className="text-gray-400">View platform usage statistics (coming soon)</p>
          </div>
        </div>
      </div>
    </div>
  )
}