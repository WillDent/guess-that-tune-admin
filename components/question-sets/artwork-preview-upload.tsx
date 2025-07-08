'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ArtworkPreviewUploadProps {
  onFileSelect: (file: File | null, preview: string | null) => void
  className?: string
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function ArtworkPreviewUpload({
  onFileSelect,
  className
}: ArtworkPreviewUploadProps) {
  const { toast } = useToast()
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validate image file
  const validateImage = (file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Please select a JPEG, PNG, or WebP image' 
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: 'Image size must be less than 5MB' 
      }
    }

    return { valid: true }
  }

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file
    const validation = validateImage(file)
    if (!validation.valid) {
      toast.error(validation.error!)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const previewUrl = reader.result as string
      setPreview(previewUrl)
      onFileSelect(file, previewUrl)
    }
    reader.readAsDataURL(file)
  }, [onFileSelect, toast])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      handleFileSelect(imageFile)
    }
  }, [handleFileSelect])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  // Handle remove artwork
  const handleRemove = useCallback(() => {
    setPreview(null)
    onFileSelect(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onFileSelect])

  return (
    <div className={cn("space-y-4", className)}>
      <label className="block text-sm font-medium mb-2">
        Artwork (optional)
      </label>
      
      <div className="relative">
        {preview ? (
          // Show preview with remove button
          <div className="relative w-32 h-32">
            <img
              src={preview}
              alt="Question set artwork"
              className="w-full h-full object-cover rounded-lg shadow-md"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          // Show upload area
          <div
            className={cn(
              "relative w-32 h-32 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
              <Upload className="h-6 w-6 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">
                Upload image
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <p className="text-xs text-gray-500">
        JPEG, PNG or WebP • Max 5MB
      </p>
    </div>
  )
}