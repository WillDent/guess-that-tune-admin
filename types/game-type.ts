export const GAME_TYPES = {
  GUESS_ARTIST: 'guess_artist',
  GUESS_SONG: 'guess_song',
} as const

export type GameType = typeof GAME_TYPES[keyof typeof GAME_TYPES]

export const gameTypeLabels: Record<GameType, string> = {
  [GAME_TYPES.GUESS_ARTIST]: 'Guess the Artist',
  [GAME_TYPES.GUESS_SONG]: 'Guess the Song',
}

export const gameTypeDescriptions: Record<GameType, string> = {
  [GAME_TYPES.GUESS_ARTIST]: 'Players will hear a song and need to identify the artist',
  [GAME_TYPES.GUESS_SONG]: 'Players will hear a song and need to identify the song title',
}