import { createClient } from '@/lib/supabase/client'
import { LocalStorageData } from '@/utils/migration/detector'
import type { Database } from '@/lib/supabase/database.types'

export interface MigrationStep {
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  error?: string
  itemsProcessed?: number
  totalItems?: number
}

export interface MigrationResult {
  success: boolean
  steps: MigrationStep[]
  summary: {
    questionSetsMigrated: number
    questionsMigrated: number
    gamesMigrated: number
    errors: string[]
  }
}

export type MigrationProgressCallback = (step: MigrationStep) => void

export class MigrationService {
  private supabase = createClient()
  private steps: MigrationStep[] = []
  private onProgress?: MigrationProgressCallback
  
  constructor(onProgress?: MigrationProgressCallback) {
    this.onProgress = onProgress
  }
  
  async migrate(userId: string, data: LocalStorageData): Promise<MigrationResult> {
    const summary = {
      questionSetsMigrated: 0,
      questionsMigrated: 0,
      gamesMigrated: 0,
      errors: [] as string[]
    }
    
    // Define migration steps
    this.steps = [
      { name: 'Validating data', status: 'pending' },
      { name: 'Migrating question sets', status: 'pending' },
      { name: 'Migrating games', status: 'pending' },
      { name: 'Migrating preferences', status: 'pending' },
      { name: 'Verifying migration', status: 'pending' }
    ]
    
    try {
      // Step 1: Validate data
      await this.executeStep(0, async () => {
        const validation = this.validateData(data)
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
        }
      })
      
      // Step 2: Migrate question sets
      await this.executeStep(1, async () => {
        const result = await this.migrateQuestionSets(userId, data.questionSets || [])
        summary.questionSetsMigrated = result.setsMigrated
        summary.questionsMigrated = result.questionsMigrated
        if (result.errors.length > 0) {
          summary.errors.push(...result.errors)
        }
      })
      
      // Step 3: Migrate games
      await this.executeStep(2, async () => {
        const result = await this.migrateGames(userId, data.games || [])
        summary.gamesMigrated = result.gamesMigrated
        if (result.errors.length > 0) {
          summary.errors.push(...result.errors)
        }
      })
      
      // Step 4: Migrate preferences
      await this.executeStep(3, async () => {
        if (data.userPreferences) {
          await this.migratePreferences(userId, data.userPreferences)
        } else {
          this.steps[3].status = 'skipped'
        }
      })
      
      // Step 5: Verify migration
      await this.executeStep(4, async () => {
        await this.verifyMigration(userId, summary)
      })
      
      return {
        success: true,
        steps: this.steps,
        summary
      }
      
    } catch (error) {
      return {
        success: false,
        steps: this.steps,
        summary: {
          ...summary,
          errors: [...summary.errors, error instanceof Error ? error.message : 'Unknown error']
        }
      }
    }
  }
  
  private async executeStep(index: number, fn: () => Promise<void>) {
    const step = this.steps[index]
    step.status = 'in_progress'
    this.notifyProgress(step)
    
    try {
      await fn()
      step.status = 'completed'
    } catch (error) {
      step.status = 'failed'
      step.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    } finally {
      this.notifyProgress(step)
    }
  }
  
  private notifyProgress(step: MigrationStep) {
    if (this.onProgress) {
      this.onProgress(step)
    }
  }
  
  private validateData(data: LocalStorageData): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Basic validation
    if (!data.questionSets && !data.games && !data.userPreferences) {
      errors.push('No data found to migrate')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  private async migrateQuestionSets(
    userId: string, 
    localSets: any[]
  ): Promise<{ setsMigrated: number; questionsMigrated: number; errors: string[] }> {
    let setsMigrated = 0
    let questionsMigrated = 0
    const errors: string[] = []
    
    for (const localSet of localSets) {
      try {
        // Create question set
        const { data: questionSet, error: setError } = await this.supabase
          .from('question_sets')
          .insert({
            user_id: userId,
            name: localSet.name || 'Unnamed Set',
            description: localSet.description || null,
            difficulty: localSet.difficulty || 'medium',
            is_public: false,
            tags: localSet.tags || null,
            created_at: localSet.createdAt || new Date().toISOString(),
            updated_at: localSet.updatedAt || new Date().toISOString()
          })
          .select()
          .single()
          
        if (setError || !questionSet) {
          errors.push(`Failed to migrate set "${localSet.name}": ${setError?.message}`)
          continue
        }
        
        setsMigrated++
        
        // Migrate questions for this set
        if (localSet.questions && Array.isArray(localSet.questions)) {
          const questions = localSet.questions.map((q: any, index: number) => ({
            question_set_id: questionSet.id,
            correct_song_id: q.correctSong?.id || q.correct_song_id || '',
            correct_song_name: q.correctSong?.name || q.correct_song_name || 'Unknown',
            correct_song_artist: q.correctSong?.artist || q.correct_song_artist || 'Unknown',
            correct_song_album: q.correctSong?.album || q.correct_song_album || null,
            correct_song_artwork_url: q.correctSong?.artwork || q.correct_song_artwork_url || null,
            correct_song_preview_url: q.correctSong?.previewUrl || q.correct_song_preview_url || null,
            order_index: index,
            detractors: q.detractors || []
          }))
          
          const { error: questionsError } = await this.supabase
            .from('questions')
            .insert(questions)
            
          if (questionsError) {
            errors.push(`Failed to migrate questions for "${localSet.name}": ${questionsError.message}`)
          } else {
            questionsMigrated += questions.length
          }
        }
        
        // Update progress
        this.steps[1].itemsProcessed = setsMigrated
        this.steps[1].totalItems = localSets.length
        this.notifyProgress(this.steps[1])
        
      } catch (error) {
        errors.push(`Error migrating set "${localSet.name}": ${error}`)
      }
    }
    
    return { setsMigrated, questionsMigrated, errors }
  }
  
  private async migrateGames(
    userId: string,
    localGames: any[]
  ): Promise<{ gamesMigrated: number; errors: string[] }> {
    let gamesMigrated = 0
    const errors: string[] = []
    
    // Note: Game migration is limited because local games may not have all required fields
    // We'll only migrate basic game history for reference
    
    for (const localGame of localGames) {
      try {
        // Skip if no question set reference
        if (!localGame.questionSetId) {
          continue
        }
        
        // Try to find the migrated question set
        const { data: questionSet } = await this.supabase
          .from('question_sets')
          .select('id')
          .eq('user_id', userId)
          .eq('name', localGame.questionSetName || '')
          .single()
          
        if (!questionSet) {
          // Skip games without matching question sets
          continue
        }
        
        // Create a basic game record
        const { error: gameError } = await this.supabase
          .from('games')
          .insert({
            question_set_id: questionSet.id,
            host_id: userId,
            game_code: `MIG${Date.now().toString(36).toUpperCase()}`,
            status: localGame.status || 'completed',
            created_at: localGame.createdAt || new Date().toISOString()
          })
          
        if (gameError) {
          errors.push(`Failed to migrate game: ${gameError.message}`)
        } else {
          gamesMigrated++
        }
        
        // Update progress
        this.steps[2].itemsProcessed = gamesMigrated
        this.steps[2].totalItems = localGames.length
        this.notifyProgress(this.steps[2])
        
      } catch (error) {
        errors.push(`Error migrating game: ${error}`)
      }
    }
    
    return { gamesMigrated, errors }
  }
  
  private async migratePreferences(userId: string, preferences: any) {
    // For now, we'll just store a note that preferences existed
    // In the future, this could update user profile settings
    console.log('User preferences detected but not migrated:', preferences)
  }
  
  private async verifyMigration(userId: string, summary: any) {
    // Verify that data was successfully migrated
    const { data: questionSets } = await this.supabase
      .from('question_sets')
      .select('id')
      .eq('user_id', userId)
      
    if (!questionSets || questionSets.length === 0) {
      if (summary.questionSetsMigrated > 0) {
        throw new Error('Verification failed: Question sets not found after migration')
      }
    }
  }
}