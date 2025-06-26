// Game status constants to ensure consistency
export const GAME_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
} as const

export type GameStatus = typeof GAME_STATUS[keyof typeof GAME_STATUS]

// Validate if a status string is valid
export function isValidGameStatus(status: string): status is GameStatus {
  return Object.values(GAME_STATUS).includes(status as GameStatus)
}

// Convert database status to typed status
export function toGameStatus(status: string): GameStatus {
  if (!isValidGameStatus(status)) {
    console.warn(`Invalid game status: ${status}, defaulting to pending`)
    return GAME_STATUS.PENDING
  }
  return status
}