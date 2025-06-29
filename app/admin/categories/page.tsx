"use client"

import { AdminRoute } from '@/components/auth/admin-route'
import { useEffect, useState } from 'react'
import CategoryForm from '@/components/categories/category-form'

interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchCategories = async () => {
    setLoading(true)
    setFormError(null)
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (res.ok) {
        setCategories(data)
      } else {
        setFormError(data.error || 'Failed to fetch categories')
      }
    } catch (err) {
      setFormError('Failed to fetch categories')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreateCategory = async (values: { name: string; description?: string }) => {
    setFormLoading(true)
    setFormError(null)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (res.ok) {
        setShowModal(false)
        fetchCategories()
      } else {
        setFormError(data.error || 'Failed to create category')
      }
    } catch (err) {
      setFormError('Failed to create category')
    }
    setFormLoading(false)
  }

  const handleEditCategory = async (values: { name: string; description?: string }) => {
    if (!editCategory) return
    setActionLoading(true)
    setActionError(null)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editCategory.id, ...values }),
      })
      const data = await res.json()
      if (res.ok) {
        setEditCategory(null)
        fetchCategories()
      } else {
        setActionError(data.error || 'Failed to update category')
      }
    } catch (err) {
      setActionError('Failed to update category')
    }
    setActionLoading(false)
  }

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return
    setActionLoading(true)
    setActionError(null)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteCategory.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setDeleteCategory(null)
        fetchCategories()
      } else {
        setActionError(data.error || 'Failed to delete category')
      }
    } catch (err) {
      setActionError('Failed to delete category')
    }
    setActionLoading(false)
  }

  return (
    <AdminRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-white">Categories</h1>
        <button
          className="mb-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold px-4 py-2 rounded"
          onClick={() => setShowModal(true)}
        >
          + New Category
        </button>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4">Create Category</h2>
              <CategoryForm
                onSubmit={handleCreateCategory}
                loading={formLoading}
                error={formError}
              />
              <button
                className="mt-4 text-gray-400 hover:text-white text-sm"
                onClick={() => setShowModal(false)}
                disabled={formLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {editCategory && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4">Edit Category</h2>
              <CategoryForm
                onSubmit={handleEditCategory}
                loading={actionLoading}
                error={actionError}
                key={editCategory.id}
                // @ts-ignore
                initialValues={{ name: editCategory.name, description: editCategory.description || '' }}
              />
              <button
                className="mt-4 text-gray-400 hover:text-white text-sm"
                onClick={() => setEditCategory(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {deleteCategory && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4">Delete Category</h2>
              <p className="text-gray-300 mb-4">Are you sure you want to delete <span className="font-semibold">{deleteCategory.name}</span>?</p>
              {actionError && <div className="text-red-400 text-sm mb-2">{actionError}</div>}
              <div className="flex gap-4">
                <button
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded"
                  onClick={handleDeleteCategory}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  className="text-gray-400 hover:text-white text-sm"
                  onClick={() => setDeleteCategory(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          <table className="min-w-full bg-gray-800 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-gray-300">Name</th>
                <th className="px-4 py-2 text-left text-gray-300">Description</th>
                <th className="px-4 py-2 text-left text-gray-300">Created At</th>
                <th className="px-4 py-2 text-left text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-700">
                  <td className="px-4 py-2 text-white">{cat.name}</td>
                  <td className="px-4 py-2 text-gray-300">{cat.description || '-'}</td>
                  <td className="px-4 py-2 text-gray-400">{new Date(cat.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <button
                      className="mr-2 text-blue-400 hover:underline"
                      onClick={() => setEditCategory(cat)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-400 hover:underline"
                      onClick={() => setDeleteCategory(cat)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminRoute>
  )
} 