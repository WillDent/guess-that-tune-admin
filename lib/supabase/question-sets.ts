import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export interface CreateQuestionSetData {
  name: string
  description?: string
  difficulty: 'easy' | 'medium' | 'hard'
  questions: {
    correctSong: {
      id: string
      name: string
      artist: string
      album?: string
      artwork?: string
      previewUrl?: string
    }
    detractors: any[]
  }[]
}

export const questionSetService = {
  async create(data: CreateQuestionSetData, userId: string) {
    const supabase = createClient()
    
    // Start by creating the question set
    const { data: questionSet, error: setError } = await supabase
      .from('question_sets')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description,
        difficulty: data.difficulty,
        question_count: data.questions.length
      })
      .select()
      .single()
    
    if (setError) throw setError
    
    // Then insert all questions
    const questions: any[] = data.questions.map((q, index) => ({
      question_set_id: questionSet.id,
      order_index: index,
      correct_song_id: q.correctSong.id,
      correct_song_name: q.correctSong.name,
      correct_song_artist: q.correctSong.artist,
      correct_song_album: q.correctSong.album,
      correct_song_artwork_url: q.correctSong.artwork,
      correct_song_preview_url: q.correctSong.previewUrl,
      detractors: q.detractors
    }))
    
    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questions)
    
    if (questionsError) {
      // Rollback by deleting the question set
      await supabase.from('question_sets').delete().eq('id', questionSet.id)
      throw questionsError
    }
    
    return questionSet
  },

  async update(id: string, data: Partial<CreateQuestionSetData>, userId: string) {
    const supabase = createClient()
    
    // Update question set metadata
    const { error: updateError } = await supabase
      .from('question_sets')
      .update({
        name: data.name,
        description: data.description,
        difficulty: data.difficulty,
        question_count: data.questions?.length
      })
      .eq('id', id)
      .eq('user_id', userId)
    
    if (updateError) throw updateError
    
    // If questions are provided, replace them
    if (data.questions) {
      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('question_set_id', id)
      
      if (deleteError) throw deleteError
      
      // Insert new questions
      const questions: any[] = data.questions.map((q, index) => ({
        question_set_id: id,
        order_index: index,
        correct_song_id: q.correctSong.id,
        correct_song_name: q.correctSong.name,
        correct_song_artist: q.correctSong.artist,
        correct_song_album: q.correctSong.album,
        correct_song_artwork_url: q.correctSong.artwork,
        correct_song_preview_url: q.correctSong.previewUrl,
        detractors: q.detractors
      }))
      
      const { error: insertError } = await supabase
        .from('questions')
        .insert(questions)
      
      if (insertError) throw insertError
    }
    
    return { success: true }
  },

  async delete(id: string, userId: string) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('question_sets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
    
    return { success: true }
  },

  async getWithQuestions(id: string) {
    const supabase = createClient()
    
    // Fetch question set with questions using regular query
    const { data, error } = await supabase
      .from('question_sets')
      .select('*, questions(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    return data
  },

  async searchPublic(searchTerm: string) {
    const supabase = createClient()
    
    // Search question sets using regular query with ilike
    const { data, error } = await supabase
      .from('question_sets')
      .select('*, user:users(id, name, email)')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data
  }
}