'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function TestStoragePage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const { toast } = useToast()
  const supabase = createSupabaseBrowserClient()

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[TEST-STORAGE] ${message}`)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      addLog(`File selected: ${selectedFile.name} (${selectedFile.size} bytes, ${selectedFile.type})`)
    }
  }

  const testDirectUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setUploading(true)
    setUploadedUrl(null)
    setLogs([])
    
    try {
      // Step 1: Get authenticated user - using API endpoint to bypass SDK hanging
      addLog('Getting authenticated user via API endpoint...')
      
      let userId: string
      let accessToken: string
      
      try {
        const response = await fetch('/api/auth/session')
        
        if (!response.ok) {
          const error = await response.json()
          addLog(`Session API error: ${error.error || 'Failed to get session'}`)
          throw new Error(error.error || 'Failed to get session')
        }
        
        const { token, userId: id } = await response.json()
        if (!token || !id) {
          throw new Error('No session data received')
        }
        
        accessToken = token
        userId = id
        addLog(`Authenticated as user: ${userId}`)
      } catch (err) {
        addLog(`Failed to get session: ${err instanceof Error ? err.message : 'Unknown error'}`)
        throw new Error('Unable to authenticate. Please try logging in again.')
      }

      // Step 2: Generate file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `test-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`
      
      addLog(`Generated file path: ${filePath}`)

      // Step 3: Upload file
      addLog('Starting file upload...')
      const uploadStart = Date.now()
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('question-set-artwork')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      const uploadDuration = Date.now() - uploadStart
      addLog(`Upload completed in ${uploadDuration}ms`)

      if (uploadError) {
        addLog(`Upload error: ${uploadError.message}`)
        throw uploadError
      }

      addLog(`Upload successful: ${JSON.stringify(uploadData)}`)

      // Step 4: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('question-set-artwork')
        .getPublicUrl(filePath)

      addLog(`Public URL: ${publicUrl}`)
      setUploadedUrl(publicUrl)

      // Step 5: Verify file exists
      addLog('Verifying file exists in storage...')
      const { data: listData, error: listError } = await supabase.storage
        .from('question-set-artwork')
        .list(userId, {
          limit: 100,
          offset: 0
        })

      if (listError) {
        addLog(`List error: ${listError.message}`)
      } else {
        addLog(`Files in user folder: ${listData?.length || 0}`)
        const uploadedFile = listData?.find(f => f.name === fileName)
        if (uploadedFile) {
          addLog(`File found: ${JSON.stringify(uploadedFile)}`)
        } else {
          addLog('File not found in listing!')
        }
      }

      toast.success('Upload test successful!')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`Error: ${errorMessage}`)
      toast.error(`Upload failed: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const testWithTimeout = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setUploading(true)
    setUploadedUrl(null)
    setLogs([])
    
    try {
      addLog('Testing upload with timeout wrapper...')
      
      // Get authenticated user via API endpoint
      addLog('Getting authenticated user via API endpoint...')
      let userId: string
      
      const response = await fetch('/api/auth/session')
      if (!response.ok) {
        throw new Error('Failed to get session')
      }
      
      const { userId: id } = await response.json()
      if (!id) {
        throw new Error('No user ID received')
      }
      userId = id
      addLog(`Authenticated as user: ${userId}`)
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timed out after 10 seconds')), 10000)
      })

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `test-timeout-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Race between upload and timeout
      const uploadPromise = supabase.storage
        .from('question-set-artwork')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      addLog('Starting upload race...')
      const result = await Promise.race([uploadPromise, timeoutPromise])
      
      const { data, error } = result as any
      
      if (error) {
        addLog(`Upload error: ${error.message}`)
        throw error
      }

      addLog('Upload completed before timeout!')
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('question-set-artwork')
        .getPublicUrl(filePath)

      setUploadedUrl(publicUrl)
      toast.success('Upload with timeout successful!')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`Error: ${errorMessage}`)
      toast.error(`Upload failed: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Storage Upload Test</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Test</h2>
        
        <div className="space-y-4">
          <div>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={testDirectUpload} 
              disabled={!file || uploading}
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Direct Upload
            </Button>
            
            <Button 
              onClick={testWithTimeout} 
              disabled={!file || uploading}
              variant="outline"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test with Timeout
            </Button>
          </div>
        </div>
      </Card>

      {uploadedUrl && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload Result</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Uploaded URL:</p>
              <p className="text-xs break-all bg-gray-100 p-2 rounded">{uploadedUrl}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <img 
                src={uploadedUrl} 
                alt="Uploaded preview" 
                className="max-w-xs rounded border"
              />
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Logs</h2>
        <div className="space-y-1 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Select a file and click upload to start.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="break-all">
                {log}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}