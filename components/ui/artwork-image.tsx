'use client'

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ArtworkImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  fallbackClassName?: string
}

export function ArtworkImage({ 
  src, 
  alt, 
  className,
  fallbackClassName = "bg-gray-100"
}: ArtworkImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if the URL is an expired OpenAI URL
  const isExpiredOpenAI = src?.includes('oaidalleapiprodscus.blob.core.windows.net')

  if (!src || error || isExpiredOpenAI) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center",
          fallbackClassName,
          className
        )}
      >
        <ImageIcon className="h-8 w-8 text-gray-400" />
      </div>
    )
  }

  return (
    <>
      {loading && (
        <div 
          className={cn(
            "flex items-center justify-center bg-gray-100 animate-pulse",
            className
          )}
        >
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(className, loading && "hidden")}
        onError={() => {
          setError(true)
          setLoading(false)
        }}
        onLoad={() => setLoading(false)}
      />
    </>
  )
}