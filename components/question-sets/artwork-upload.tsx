'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useQuestionSetArtwork } from '@/hooks/use-question-set-artwork'

interface ArtworkUploadProps {
  currentArtworkUrl?: string | null
  onUpload: (url: string) => void
  onRemove: () => void
  onGenerateAI?: () => void
  questionSetId: string
  className?: string
}

export function ArtworkUpload({
  currentArtworkUrl,
  onUpload,
  onRemove,
  onGenerateAI,
  questionSetId,
  className
}: ArtworkUploadProps) {
  const { uploadArtwork, deleteArtwork, isUploading, validateImage } = useQuestionSetArtwork()
  const [preview, setPreview] = useState<string | null>(currentArtworkUrl || null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update preview when currentArtworkUrl changes
  useEffect(() => {
    setPreview(currentArtworkUrl || null)
  }, [currentArtworkUrl])

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file
    const validation = validateImage(file)
    if (!validation.valid) {
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    const { url, error } = await uploadArtwork(file, questionSetId)
    if (url && !error) {
      onUpload(url)
    } else if (error) {
      // Reset preview on error
      setPreview(currentArtworkUrl || null)
    }
  }, [uploadArtwork, validateImage, questionSetId, onUpload, currentArtworkUrl])

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
  const handleRemove = useCallback(async () => {
    if (!currentArtworkUrl) return

    const { error } = await deleteArtwork(currentArtworkUrl, questionSetId)
    if (!error) {
      setPreview(null)
      onRemove()
    }
  }, [currentArtworkUrl, deleteArtwork, questionSetId, onRemove])

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        {preview ? (
          // Show preview with remove button
          <div className="relative aspect-square w-full max-w-xs mx-auto">
            <img
              src={preview}
              alt="Question set artwork"
              className="w-full h-full object-cover rounded-lg shadow-md"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            {!isUploading && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          // Show upload area
          <div
            className={cn(
              "relative aspect-square w-full max-w-xs mx-auto border-2 border-dashed rounded-lg transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
              isUploading && "pointer-events-none opacity-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {isUploading ? (
                <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-4" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
              )}
              <p className="text-sm font-medium text-gray-700">
                {isUploading ? 'Uploading...' : 'Click or drag image to upload'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                JPEG, PNG or WebP • Max 5MB • Square recommended
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
        disabled={isUploading}
      />

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {/* Change image button (when image exists) */}
        {preview && !isUploading && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Change Image
            </Button>
          </div>
        )}
        
        {/* AI Generation button (when no image exists) */}
        {!preview && onGenerateAI && !isUploading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateAI}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
        )}
      </div>
    </div>
  )
}