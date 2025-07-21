// Common variations that should be normalized
const TAG_VARIATIONS: Record<string, string> = {
  '80s': 'eighties',
  '90s': 'nineties',
  '00s': 'two-thousands',
  '2000s': 'two-thousands',
  '2010s': 'twenty-tens',
  'hiphop': 'hip-hop',
  'hip hop': 'hip-hop',
  'r&b': 'rnb',
  'r and b': 'rnb',
  'rock n roll': 'rock-and-roll',
  'rock & roll': 'rock-and-roll',
  'xmas': 'christmas',
  'x-mas': 'christmas',
}

// Blocked words/tags
const BLOCKED_TAGS = new Set([
  'test',
  'testing',
  'temp',
  'temporary',
  'delete',
  'deleted',
  'xxx',
  'todo',
  'fixme',
])

export function normalizeTag(tag: string): string {
  const normalized = tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 30)

  // Apply common variations
  return TAG_VARIATIONS[normalized] || normalized
}

export function validateTag(tag: string): { valid: boolean; error?: string } {
  const normalized = normalizeTag(tag)
  
  if (normalized.length < 2) {
    return { valid: false, error: 'Tag must be at least 2 characters' }
  }
  
  if (normalized.length > 30) {
    return { valid: false, error: 'Tag must be 30 characters or less' }
  }
  
  if (BLOCKED_TAGS.has(normalized)) {
    return { valid: false, error: 'This tag is not allowed' }
  }
  
  // Check if it's just numbers
  if (/^\d+$/.test(normalized)) {
    return { valid: false, error: 'Tag cannot be only numbers' }
  }
  
  return { valid: true }
}

export function suggestSimilarTags(tag: string, existingTags: string[]): string[] {
  const normalized = normalizeTag(tag)
  const suggestions: string[] = []
  
  // Check for similar tags (edit distance)
  existingTags.forEach(existing => {
    const distance = levenshteinDistance(normalized, existing)
    if (distance > 0 && distance <= 2) {
      suggestions.push(existing)
    }
  })
  
  return suggestions
}

// Simple Levenshtein distance implementation
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}