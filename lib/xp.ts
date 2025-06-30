// XP/Level calculation utility for Guess That Tune

export interface XPResult {
  newXP: number;
  newLevel: number;
}

/**
 * Calculates new XP and level after adding XP.
 * Levels up for every (level * 1000) XP.
 * @param currentXP Current XP (integer)
 * @param currentLevel Current level (integer)
 * @param xpToAdd XP to add (integer)
 * @returns { newXP, newLevel }
 */
export function calculateXPLevel(currentXP: number, currentLevel: number, xpToAdd: number): XPResult {
  let newXP = currentXP + xpToAdd;
  let newLevel = currentLevel;
  while (newXP >= newLevel * 1000) {
    newXP -= newLevel * 1000;
    newLevel += 1;
  }
  return { newXP, newLevel };
} 