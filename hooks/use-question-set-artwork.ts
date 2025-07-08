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
    try {
      setIsUploading(true)
      setUploadError(null)

      // Validate the image
      const validation = validateImage(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('You must be logged in to upload artwork')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${questionSetId}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Check if user owns the question set
      const { data: questionSet, error: fetchError } = await supabase
        .from('question_sets')
        .select('user_id, artwork_url')
        .eq('id', questionSetId)
        .single()

      if (fetchError || !questionSet) {
        throw new Error('Question set not found')
      }

      if (questionSet.user_id !== user.id) {
        throw new Error('You can only upload artwork for your own question sets')
      }

      // Delete old artwork if it exists
      if (questionSet.artwork_url) {
        try {
          const oldUrl = new URL(questionSet.artwork_url)
          const oldPath = oldUrl.pathname.split('/').slice(-2).join('/')
          
          await supabase.storage
            .from('question-set-artwork')
            .remove([oldPath])
        } catch (err) {
          console.error('Error deleting old artwork:', err)
          // Continue with upload even if delete fails
        }
      }

      // Upload new artwork
      const { error: uploadError } = await supabase.storage
        .from('question-set-artwork')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('question-set-artwork')
        .getPublicUrl(filePath)

      // Update question set with new artwork URL
      const { error: updateError } = await supabase
        .from('question_sets')
        .update({ 
          artwork_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', questionSetId)

      if (updateError) {
        // Try to clean up uploaded file
        await supabase.storage
          .from('question-set-artwork')
          .remove([filePath])
        throw updateError
      }

      toast.success('Artwork uploaded successfully')
      return { url: publicUrl, error: null }

    } catch (err) {
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

      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
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

      if (questionSet.user_id !== user.id) {
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