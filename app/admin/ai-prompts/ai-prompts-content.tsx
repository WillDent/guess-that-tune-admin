'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit, Save, X, TestTube, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AIPromptTestModal } from '@/components/admin/ai-prompt-test-modal'

interface AIPrompt {
  id: string
  user_id: string
  name: string
  description: string | null
  prompt_template: string
  variables: string[]
  style: 'abstract' | 'realistic' | 'artistic' | 'minimalist'
  color_scheme: 'vibrant' | 'dark' | 'pastel' | 'monochrome'
  is_active: boolean
  is_default: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

interface AIPromptsContentProps {
  initialPrompts: AIPrompt[]
  userId: string
}

export function AIPromptsContent({ initialPrompts, userId }: AIPromptsContentProps) {
  const { toast } = useToast()
  const [prompts, setPrompts] = useState<AIPrompt[]>(initialPrompts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [testingPrompt, setTestingPrompt] = useState<AIPrompt | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt_template: 'Create album cover artwork for a music collection. Style: {{style_description}} with {{color_description}}. {{theme_context}} {{visual_elements}} No text, words, or typography in the image. Focus on visual elements only.',
    style: 'artistic' as const,
    color_scheme: 'vibrant' as const,
    is_active: true,
    is_default: false
  })

  // Extract variables from template
  const extractVariables = (template: string): string[] => {
    const matches = template.match(/\{\{(\w+)\}\}/g)
    if (!matches) return []
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
  }

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      const variables = extractVariables(formData.prompt_template)
      
      const response = await fetch('/api/admin/ai-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variables,
          user_id: userId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create prompt')
      }

      const newPrompt = await response.json()
      setPrompts([newPrompt, ...prompts])
      setIsCreating(false)
      setFormData({
        name: '',
        description: '',
        prompt_template: 'Create album cover artwork for a music collection. Style: {{style_description}} with {{color_description}}. {{theme_context}} {{visual_elements}} No text, words, or typography in the image. Focus on visual elements only.',
        style: 'artistic',
        color_scheme: 'vibrant',
        is_active: true,
        is_default: false
      })
      toast.success('Prompt created successfully')
    } catch (error) {
      console.error('Error creating prompt:', error)
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (prompt: AIPrompt) => {
    setIsSaving(true)
    try {
      const variables = extractVariables(prompt.prompt_template)
      
      const response = await fetch(`/api/admin/ai-prompts/${prompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prompt,
          variables
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update prompt')
      }

      const updatedPrompt = await response.json()
      setPrompts(prompts.map(p => p.id === updatedPrompt.id ? updatedPrompt : p))
      setEditingId(null)
      toast.success('Prompt updated successfully')
    } catch (error) {
      console.error('Error updating prompt:', error)
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return
    
    setIsDeleting(id)
    try {
      const response = await fetch(`/api/admin/ai-prompts/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete prompt')
      }

      setPrompts(prompts.filter(p => p.id !== id))
      toast.success('Prompt deleted successfully')
    } catch (error) {
      console.error('Error deleting prompt:', error)
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setIsDeleting(null)
    }
  }

  const handleTest = async (prompt: AIPrompt) => {
    setTestingPrompt(prompt)
  }

  const handleDuplicate = (prompt: AIPrompt) => {
    setFormData({
      name: `${prompt.name} (Copy)`,
      description: prompt.description || '',
      prompt_template: prompt.prompt_template,
      style: prompt.style,
      color_scheme: prompt.color_scheme,
      is_active: prompt.is_active,
      is_default: false
    })
    setIsCreating(true)
  }

  return (
    <div className="space-y-6">
      {/* Create button */}
      {!isCreating && (
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Prompt
        </Button>
      )}

      {/* Create form */}
      {isCreating && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Prompt</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Custom Prompt"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of when to use this prompt"
              />
            </div>

            <div>
              <Label htmlFor="prompt_template">Prompt Template</Label>
              <Textarea
                id="prompt_template"
                value={formData.prompt_template}
                onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
                rows={6}
                className="font-mono text-sm"
                placeholder="Use {{variable_name}} for dynamic content"
              />
              <p className="text-sm text-gray-600 mt-2">
                Variables detected: {extractVariables(formData.prompt_template).join(', ') || 'none'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="style">Style</Label>
                <Select
                  value={formData.style}
                  onValueChange={(value) => setFormData({ ...formData, style: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color_scheme">Color Scheme</Label>
                <Select
                  value={formData.color_scheme}
                  onValueChange={(value) => setFormData({ ...formData, color_scheme: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vibrant">Vibrant</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="pastel">Pastel</SelectItem>
                    <SelectItem value="monochrome">Monochrome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label htmlFor="is_default">Set as Default</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={isSaving || !formData.name || !formData.prompt_template}>
                {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Create
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Prompts list */}
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="p-6">
            {editingId === prompt.id ? (
              // Edit mode
              <div className="space-y-4">
                <Input
                  value={prompt.name}
                  onChange={(e) => setPrompts(prompts.map(p => p.id === prompt.id ? { ...p, name: e.target.value } : p))}
                  placeholder="Prompt name"
                />
                <Input
                  value={prompt.description || ''}
                  onChange={(e) => setPrompts(prompts.map(p => p.id === prompt.id ? { ...p, description: e.target.value } : p))}
                  placeholder="Description"
                />
                <Textarea
                  value={prompt.prompt_template}
                  onChange={(e) => setPrompts(prompts.map(p => p.id === prompt.id ? { ...p, prompt_template: e.target.value } : p))}
                  rows={6}
                  className="font-mono text-sm"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={prompt.style}
                    onValueChange={(value) => setPrompts(prompts.map(p => p.id === prompt.id ? { ...p, style: value as any } : p))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abstract">Abstract</SelectItem>
                      <SelectItem value="realistic">Realistic</SelectItem>
                      <SelectItem value="artistic">Artistic</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={prompt.color_scheme}
                    onValueChange={(value) => setPrompts(prompts.map(p => p.id === prompt.id ? { ...p, color_scheme: value as any } : p))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vibrant">Vibrant</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="pastel">Pastel</SelectItem>
                      <SelectItem value="monochrome">Monochrome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdate(prompt)} disabled={isSaving}>
                    {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditingId(null)} disabled={isSaving}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{prompt.name}</h3>
                    {prompt.description && (
                      <p className="text-sm text-gray-600">{prompt.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {prompt.is_default && <Badge>Default</Badge>}
                    {prompt.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    <Badge variant="outline">{prompt.usage_count} uses</Badge>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{prompt.prompt_template}</pre>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-sm">
                    <Badge variant="outline">{prompt.style}</Badge>
                    <Badge variant="outline">{prompt.color_scheme}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTest(prompt)}>
                      <TestTube className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(prompt)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingId(prompt.id)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(prompt.id)}
                      disabled={isDeleting === prompt.id}
                    >
                      {isDeleting === prompt.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {prompts.length === 0 && !isCreating && (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No AI prompts created yet</p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Prompt
          </Button>
        </Card>
      )}

      {/* Test Modal */}
      {testingPrompt && (
        <AIPromptTestModal
          isOpen={!!testingPrompt}
          onClose={() => setTestingPrompt(null)}
          prompt={testingPrompt}
        />
      )}
    </div>
  )
}