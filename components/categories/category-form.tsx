import { useState, useEffect } from 'react'

interface CategoryFormProps {
  onSubmit: (values: { name: string; description?: string }) => Promise<void> | void
  loading?: boolean
  error?: string | null
  initialValues?: { name: string; description?: string }
}

export default function CategoryForm({ onSubmit, loading, error, initialValues }: CategoryFormProps) {
  const [name, setName] = useState(initialValues?.name || '')
  const [description, setDescription] = useState(initialValues?.description || '')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setName(initialValues?.name || '')
    setDescription(initialValues?.description || '')
  }, [initialValues])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!name.trim()) {
      setFormError('Name is required')
      return
    }
    await onSubmit({ name: name.trim(), description: description.trim() || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full rounded bg-gray-700 text-white px-3 py-2 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-1">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full rounded bg-gray-700 text-white px-3 py-2 focus:outline-none"
          rows={2}
        />
      </div>
      {(formError || error) && (
        <div className="text-red-400 text-sm">{formError || error}</div>
      )}
      <button
        type="submit"
        className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Saving...' : initialValues ? 'Save Changes' : 'Create Category'}
      </button>
    </form>
  )
} 