'use client'

import { useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client-with-singleton'
import { useToast } from '@/hooks/use-toast'
import { handleSupabaseError } from '@/utils/supabase/error-handler'
import type { Database } from '@/lib/supabase/database.types'

export interface UseQuestionSetArtworkReturn {
  uploadArtwork: (file: File, questionSetId: string) => Promise<{ url: string | null; error: Error | null }>
  deleteArtwork: (artworkUrl: string, questionSetId: string) => Promise<{ error: Error | null }>
  isUploading: boolean
  uploadError: Error | null
  validateImage: (file: File) => { valid: boolean; error?: string }
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function useQuestionSetArtwork(): UseQuestionSetArtworkReturn {
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<Error | null>(null)

  // Validate image file
  const validateImage = useCallback((file: File): { valid: boolean; error?: string } => {
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
  }, [])

  // Upload artwork to Supabase Storage
  const uploadArtwork = useCallback(async (
    file: File, 
    questionSetId: string
  ): Promise<{ url: string | null; error: Error | null }> => {
    console.log('[ARTWORK-UPLOAD] Starting upload for question set:', questionSetId)
    console.log('[ARTWORK-UPLOAD] File:', { name: file.name, size: file.size, type: file.type })
    
    try {
      setIsUploading(true)
      setUploadError(null)

      // Validate the image
      const validation = validateImage(file)
      if (!validation.valid) {
        console.error('[ARTWORK-UPLOAD] Validation failed:', validation.error)
        throw new Error(validation.error)
      }

      // Get authenticated user via API to bypass SDK hanging
      console.log('[ARTWORK-UPLOAD] Getting authenticated user via API...')
      let userId: string
      let accessToken: string
      
      try {
        const response = await fetch('/api/auth/session')
        console.log('[ARTWORK-UPLOAD] Session response status:', response.status)
        
        if (!response.ok) {
          const error = await response.json()
          console.error('[ARTWORK-UPLOAD] Session API error:', error)
          throw new Error(error.error || 'Failed to get session')
        }
        
        const sessionData = await response.json()
        console.log('[ARTWORK-UPLOAD] Session data received:', { hasToken: !!sessionData.token, hasUserId: !!sessionData.userId })
        
        const { token, userId: id } = sessionData
        if (!token || !id) {
          console.error('[ARTWORK-UPLOAD] Missing session data:', sessionData)
          throw new Error('No session data received')
        }
        
        accessToken = token
        userId = id
        console.log('[ARTWORK-UPLOAD] Authenticated as user:', userId)
      } catch (err) {
        console.error('[ARTWORK-UPLOAD] Failed to get session:', err)
        throw new Error('You must be logged in to upload artwork')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${questionSetId}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`
      console.log('[ARTWORK-UPLOAD] File path:', filePath)

      // Check if user owns the question set
      console.log('[ARTWORK-UPLOAD] Checking question set ownership...')
      const { data: questionSet, error: fetchError } = await supabase
        .from('question_sets')
        .select('user_id, artwork_url')
        .eq('id', questionSetId)
        .single()

      if (fetchError || !questionSet) {
        console.error('[ARTWORK-UPLOAD] Question set fetch error:', fetchError)
        throw new Error('Question set not found')
      }

      if (questionSet.user_id !== userId) {
        console.error('[ARTWORK-UPLOAD] Ownership mismatch:', { questionSetUserId: questionSet.user_id, currentUserId: userId })
        throw new Error('You can only upload artwork for your own question sets')
      }

      // Delete old artwork if it exists
      if (questionSet.artwork_url) {
        console.log('[ARTWORK-UPLOAD] Deleting old artwork:', questionSet.artwork_url)
        try {
          const oldUrl = new URL(questionSet.artwork_url)
          const oldPath = oldUrl.pathname.split('/').slice(-2).join('/')
          
          await supabase.storage
            .from('question-set-artwork')
            .remove([oldPath])
          console.log('[ARTWORK-UPLOAD] Old artwork deleted')
        } catch (err) {
          console.error('[ARTWORK-UPLOAD] Error deleting old artwork:', err)
          // Continue with upload even if delete fails
        }
      }

      // Upload new artwork with timeout
      console.log('[ARTWORK-UPLOAD] Starting file upload...')
      console.log('[ARTWORK-UPLOAD] Upload details:', {
        bucket: 'question-set-artwork',
        filePath,
        fileSize: file.size,
        fileType: file.type
      })
      const uploadStart = Date.now()
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timed out after 30 seconds')), 30000)
      })
      
      // Create upload promise
      const uploadPromise = supabase.storage
        .from('question-set-artwork')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      // Race between upload and timeout
      const result = await Promise.race([uploadPromise, timeoutPromise]) as any
      const uploadDuration = Date.now() - uploadStart
      console.log('[ARTWORK-UPLOAD] Upload completed in', uploadDuration, 'ms')
      console.log('[ARTWORK-UPLOAD] Upload result:', result)
      
      if (result.error) {
        console.error('[ARTWORK-UPLOAD] Upload error:', result.error)
        throw result.error
      }

      // Get public URL
      console.log('[ARTWORK-UPLOAD] Getting public URL...')
      const { data: { publicUrl } } = supabase.storage
        .from('question-set-artwork')
        .getPublicUrl(filePath)
      console.log('[ARTWORK-UPLOAD] Public URL:', publicUrl)

      // Update question set with new artwork URL
      console.log('[ARTWORK-UPLOAD] Updating question set with artwork URL...')
      const { error: updateError } = await supabase
        .from('question_sets')
        .update({ 
          artwork_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', questionSetId)

      if (updateError) {
        console.error('[ARTWORK-UPLOAD] Update error:', updateError)
        // Try to clean up uploaded file
        await supabase.storage
          .from('question-set-artwork')
          .remove([filePath])
        throw updateError
      }

      console.log('[ARTWORK-UPLOAD] Upload successful!')
      toast.success('Artwork uploaded successfully')
      return { url: publicUrl, error: null }

    } catch (err) {
      console.error('[ARTWORK-UPLOAD] Error:', err)
      const handledError = handleSupabaseError(err)
      const error = new Error(handledError.message)
      setUploadError(error)
      toast.error(handledError.message)
      return { url: null, error }
    } finally {
      setIsUploading(false)
    }
  }, [supabase, toast, validateImage])

  // Delete artwork
  const deleteArtwork = useCallback(async (
    artworkUrl: string,
    questionSetId: string
  ): Promise<{ error: Error | null }> => {
    try {
      setIsUploading(true)
      setUploadError(null)

      // Get authenticated user via API to bypass SDK hanging
      let userId: string
      
      try {
        const response = await fetch('/api/auth/session')
        if (!response.ok) {
          throw new Error('Failed to get session')
        }
        
        const { userId: id } = await response.json()
        if (!id) {
          throw new Error('No session data received')
        }
        
        userId = id
      } catch (err) {
        throw new Error('You must be logged in to delete artwork')
      }

      // Check if user owns the question set
      const { data: questionSet, error: fetchError } = await supabase
        .from('question_sets')
        .select('user_id')
        .eq('id', questionSetId)
        .single()

      if (fetchError || !questionSet) {
        throw new Error('Question set not found')
      }

      if (questionSet.user_id !== userId) {
        throw new Error('You can only delete artwork for your own question sets')
      }

      // Extract file path from URL
      const url = new URL(artworkUrl)
      const filePath = url.pathname.split('/').slice(-2).join('/')

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('question-set-artwork')
        .remove([filePath])

      if (deleteError) {
        throw deleteError
      }

      // Update question set to remove artwork URL
      const { error: updateError } = await supabase
        .from('question_sets')
        .update({ 
          artwork_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', questionSetId)

      if (updateError) {
        throw updateError
      }

      toast.success('Artwork removed successfully')
      return { error: null }

    } catch (err) {
      const handledError = handleSupabaseError(err)
      const error = new Error(handledError.message)
      setUploadError(error)
      toast.error(handledError.message)
      return { error }
    } finally {
      setIsUploading(false)
    }
  }, [supabase, toast])

  return {
    uploadArtwork,
    deleteArtwork,
    isUploading,
    uploadError,
    validateImage
  }
}