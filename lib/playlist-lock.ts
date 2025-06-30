// Playlist locking utility for Guess That Tune

export type PlaylistState = 'LOCKED' | 'NEW' | 'TRENDING' | string;

/**
 * Returns true if the playlist should be locked for the user.
 * Locked if state is 'LOCKED' or userLevel < requiredLevel.
 */
export function isPlaylistLocked({
  requiredLevel,
  state,
  userLevel,
}: {
  requiredLevel: number;
  state: PlaylistState;
  userLevel: number;
}): boolean {
  if (state === 'LOCKED') return true;
  if (userLevel < requiredLevel) return true;
  return false;
}

/**
 * Returns a string reason if locked, or null if not locked.
 */
export function getPlaylistLockReason({
  requiredLevel,
  state,
  userLevel,
}: {
  requiredLevel: number;
  state: PlaylistState;
  userLevel: number;
}): string | null {
  if (state === 'LOCKED') return 'Playlist is locked by admin.';
  if (userLevel < requiredLevel) return `Requires level ${requiredLevel}.`;
  return null;
} 