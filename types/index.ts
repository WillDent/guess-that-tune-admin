export interface Song {
  id: string
  name: string
  artist: string
  album?: string
  artwork?: string
  previewUrl?: string
}

export interface Question {
  correctSong: Song
  detractors: Song[]
}

export interface QuestionSet {
  id: string
  name: string
  description?: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
  playCount: number
  createdAt: string
  questions: Question[]
}

export interface Game {
  id: string
  name: string
  questionSetId: string
  status: 'pending' | 'in_progress' | 'completed'
  createdAt: string
  players?: string[]
  currentQuestion?: number
}

export interface QuestionSetFormData {
  name: string
  description?: string
  difficulty: 'easy' | 'medium' | 'hard'
  questions: Question[]
}