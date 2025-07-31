// Theme-based song discovery service using OpenAI
// Researches and suggests songs based on complex themes and narratives

import OpenAI from 'openai'

export interface ThemeSearchRequest {
  theme: string
  description?: string
  constraints?: {
    yearRange?: { start: number; end: number }
    genres?: string[]
    explicitAllowed?: boolean
    count?: number
  }
}

export interface OpenAISongSuggestion {
  title: string
  artist: string
  album?: string
  year?: number
  reason: string
  confidence: 'high' | 'medium' | 'low'
}

export interface ThemeSearchResponse {
  theme: string
  interpretation: string
  suggestions: OpenAISongSuggestion[]
  searchStrategy: string
}

export class ThemeDiscoveryService {
  private openai: OpenAI

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured')
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async discoverSongsByTheme(request: ThemeSearchRequest): Promise<ThemeSearchResponse> {
    const { theme, description, constraints } = request
    const count = constraints?.count || 20

    try {
      const prompt = this.buildPrompt(theme, description, constraints)
      
      console.log('[ThemeDiscovery] Researching theme:', theme)
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a music expert with deep knowledge of songs across all genres and eras. 
            Your task is to suggest songs that match specific themes, moods, or narratives.
            Always provide real songs that actually exist and can be found on music streaming services.
            Include a mix of well-known and lesser-known tracks when appropriate.
            Format your response as valid JSON.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      })

      const response = JSON.parse(completion.choices[0].message.content || '{}')
      
      return {
        theme,
        interpretation: response.interpretation || theme,
        suggestions: this.validateSuggestions(response.songs || []),
        searchStrategy: response.strategy || 'thematic'
      }
    } catch (error) {
      console.error('[ThemeDiscovery] Error:', error)
      throw new Error(`Failed to discover songs for theme: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildPrompt(theme: string, description?: string, constraints?: ThemeSearchRequest['constraints']): string {
    const parts = [`Find ${constraints?.count || 20} songs that match the theme: "${theme}"`]
    
    if (description) {
      parts.push(`Additional context: ${description}`)
    }
    
    if (constraints?.yearRange) {
      parts.push(`Songs should be from ${constraints.yearRange.start} to ${constraints.yearRange.end}`)
    }
    
    if (constraints?.genres && constraints.genres.length > 0) {
      parts.push(`Preferred genres: ${constraints.genres.join(', ')}`)
    }
    
    if (constraints?.explicitAllowed === false) {
      parts.push('Exclude songs with explicit content')
    }
    
    parts.push(`
Return a JSON object with this structure:
{
  "interpretation": "Your understanding of what the user is looking for",
  "strategy": "How you approached finding these songs",
  "songs": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name (if known)",
      "year": 2020,
      "reason": "Why this song fits the theme",
      "confidence": "high|medium|low"
    }
  ]
}

Guidelines:
- Include a diverse mix of artists and eras unless specified otherwise
- Provide specific reasons why each song matches the theme
- Use "high" confidence for perfect matches, "medium" for good matches, "low" for creative interpretations
- Ensure all songs are real and can be found on major streaming platforms
- Balance popular hits with hidden gems`)
    
    return parts.join('\n\n')
  }

  private validateSuggestions(songs: any[]): OpenAISongSuggestion[] {
    return songs
      .filter(song => song.title && song.artist)
      .map(song => ({
        title: song.title,
        artist: song.artist,
        album: song.album,
        year: song.year,
        reason: song.reason || 'Matches the theme',
        confidence: this.validateConfidence(song.confidence)
      }))
  }

  private validateConfidence(confidence: any): 'high' | 'medium' | 'low' {
    if (['high', 'medium', 'low'].includes(confidence)) {
      return confidence
    }
    return 'medium'
  }

  async validateTheme(theme: string): Promise<{ valid: boolean; suggestion?: string }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You help validate if a theme is suitable for finding songs. Respond with JSON.'
          },
          {
            role: 'user',
            content: `Is this a valid theme for finding songs: "${theme}"? 
            If not specific enough, suggest an improvement.
            Response format: { "valid": boolean, "suggestion": "improved theme if needed" }`
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })

      return JSON.parse(completion.choices[0].message.content || '{"valid": true}')
    } catch (error) {
      console.error('[ThemeDiscovery] Validation error:', error)
      return { valid: true } // Default to valid on error
    }
  }

  // Preset theme templates for quick access
  static getPresetThemes() {
    return [
      {
        id: 'overcome',
        name: 'Overcoming Adversity',
        theme: 'Songs about overcoming challenges and rising above adversity',
        description: 'Inspirational tracks about perseverance, strength, and triumph'
      },
      {
        id: 'smalltown',
        name: 'Small Town Stories',
        theme: 'Songs that tell stories about small-town life',
        description: 'Narrative songs about rural communities, hometown nostalgia, and simple living'
      },
      {
        id: 'space',
        name: 'Cosmic Journey',
        theme: 'Music about space exploration and the cosmos',
        description: 'Songs featuring themes of space, stars, astronauts, and the universe'
      },
      {
        id: 'rain',
        name: 'Rainy Day Vibes',
        theme: 'Perfect songs for a rainy afternoon',
        description: 'Mellow, contemplative tracks that match the mood of rainfall'
      },
      {
        id: 'coding',
        name: 'Focus Flow',
        theme: 'Music for deep focus and concentration while coding',
        description: 'Instrumental or ambient tracks that enhance productivity without distraction'
      },
      {
        id: 'roadtrip',
        name: 'Highway Adventures',
        theme: 'Ultimate road trip playlist songs',
        description: 'Driving songs with energy, wanderlust, and adventure themes'
      },
      {
        id: 'healing',
        name: 'Healing Heart',
        theme: 'Songs about healing and moving forward after heartbreak',
        description: 'Emotional journey from pain to acceptance and growth'
      },
      {
        id: 'rebellion',
        name: 'Teenage Rebellion',
        theme: 'Music that captures teenage rebellion and youth defiance',
        description: 'Anthems of youth, independence, and challenging authority'
      },
      {
        id: 'nature',
        name: 'Natural World',
        theme: 'Songs celebrating nature and the environment',
        description: 'Music about forests, oceans, mountains, and our connection to Earth'
      },
      {
        id: 'time',
        name: 'Passage of Time',
        theme: 'Songs about time, aging, and life\'s fleeting moments',
        description: 'Reflective tracks about growing older, nostalgia, and temporal themes'
      }
    ]
  }
}

export const themeDiscoveryService = new ThemeDiscoveryService()