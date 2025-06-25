export interface LocalStorageData {
  questionSets?: any[]
  games?: any[]
  userPreferences?: any
}

export interface MigrationSummary {
  hasData: boolean
  questionSets: {
    count: number
    totalQuestions: number
    names: string[]
  }
  games: {
    count: number
    completed: number
    inProgress: number
  }
  totalSize: number
  estimatedTime: string
}

export function checkForLocalStorageData(): boolean {
  if (typeof window === 'undefined') return false
  
  const keys = ['questionSets', 'games', 'userPreferences']
  return keys.some(key => {
    try {
      const data = localStorage.getItem(key)
      if (!data) return false
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0
    } catch {
      return false
    }
  })
}

export function getLocalStorageData(): LocalStorageData {
  const data: LocalStorageData = {}
  
  try {
    const questionSets = localStorage.getItem('questionSets')
    if (questionSets) {
      data.questionSets = JSON.parse(questionSets)
    }
  } catch (e) {
    console.error('Error parsing questionSets:', e)
  }
  
  try {
    const games = localStorage.getItem('games')
    if (games) {
      data.games = JSON.parse(games)
    }
  } catch (e) {
    console.error('Error parsing games:', e)
  }
  
  try {
    const userPreferences = localStorage.getItem('userPreferences')
    if (userPreferences) {
      data.userPreferences = JSON.parse(userPreferences)
    }
  } catch (e) {
    console.error('Error parsing userPreferences:', e)
  }
  
  return data
}

export function getMigrationSummary(data: LocalStorageData): MigrationSummary {
  const questionSets = data.questionSets || []
  const games = data.games || []
  
  // Calculate total questions
  const totalQuestions = questionSets.reduce((sum, set) => 
    sum + (set.questions?.length || 0), 0
  )
  
  // Calculate games by status
  const completedGames = games.filter(g => g.status === 'completed').length
  const inProgressGames = games.filter(g => g.status === 'in_progress').length
  
  // Estimate migration time (rough estimate: 1 second per 10 items)
  const totalItems = questionSets.length + totalQuestions + games.length
  const estimatedSeconds = Math.ceil(totalItems / 10)
  const estimatedTime = estimatedSeconds < 60 
    ? `${estimatedSeconds} seconds`
    : `${Math.ceil(estimatedSeconds / 60)} minutes`
  
  // Calculate total size
  const totalSize = JSON.stringify(data).length
  
  return {
    hasData: questionSets.length > 0 || games.length > 0,
    questionSets: {
      count: questionSets.length,
      totalQuestions,
      names: questionSets.map(s => s.name || 'Unnamed Set').slice(0, 5)
    },
    games: {
      count: games.length,
      completed: completedGames,
      inProgress: inProgressGames
    },
    totalSize,
    estimatedTime
  }
}

export function validateLocalData(data: LocalStorageData): { 
  valid: boolean
  errors: string[] 
} {
  const errors: string[] = []
  
  // Validate question sets
  if (data.questionSets) {
    data.questionSets.forEach((set, index) => {
      if (!set.name) {
        errors.push(`Question set ${index + 1} is missing a name`)
      }
      if (!set.questions || !Array.isArray(set.questions)) {
        errors.push(`Question set "${set.name || index + 1}" has invalid questions`)
      }
      if (!set.difficulty || !['easy', 'medium', 'hard'].includes(set.difficulty)) {
        errors.push(`Question set "${set.name || index + 1}" has invalid difficulty`)
      }
    })
  }
  
  // Validate games
  if (data.games) {
    data.games.forEach((game, index) => {
      if (!game.id) {
        errors.push(`Game ${index + 1} is missing an ID`)
      }
      if (!game.questionSetId) {
        errors.push(`Game ${index + 1} is missing a question set reference`)
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function getMigrationStatus(): { hasMigrated: boolean, timestamp?: string } {
  try {
    const status = localStorage.getItem('migrationStatus')
    if (status) {
      const parsed = JSON.parse(status)
      return {
        hasMigrated: parsed.completed === true,
        timestamp: parsed.timestamp
      }
    }
  } catch {
    // Ignore errors
  }
  
  return { hasMigrated: false }
}

export function setMigrationStatus(completed: boolean): void {
  localStorage.setItem('migrationStatus', JSON.stringify({
    completed,
    timestamp: new Date().toISOString()
  }))
}