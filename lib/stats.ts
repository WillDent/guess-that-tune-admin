// Stats tracking utility for Guess That Tune

/**
 * Increments total plays by 1.
 */
export function updateTotalPlays(currentTotal: number): number {
  return currentTotal + 1;
}

/**
 * Adds a playerId to the set if not present, returns updated set and count.
 */
export function updateUniquePlayers(playerSet: Set<string>, newPlayerId: string): { set: Set<string>; count: number } {
  const updatedSet = new Set(playerSet);
  updatedSet.add(newPlayerId);
  return { set: updatedSet, count: updatedSet.size };
}

/**
 * Returns the unique player count from an array of playerIds.
 */
export function getUniquePlayerCount(playerIds: string[]): number {
  return new Set(playerIds).size;
} 