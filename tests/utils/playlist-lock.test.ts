import { isPlaylistLocked, getPlaylistLockReason } from '../../lib/playlist-lock';

describe('Playlist locking utility', () => {
  it('returns true if state is LOCKED', () => {
    expect(isPlaylistLocked({ requiredLevel: 1, state: 'LOCKED', userLevel: 10 })).toBe(true);
    expect(getPlaylistLockReason({ requiredLevel: 1, state: 'LOCKED', userLevel: 10 })).toBe('Playlist is locked by admin.');
  });

  it('returns true if userLevel < requiredLevel', () => {
    expect(isPlaylistLocked({ requiredLevel: 5, state: 'NEW', userLevel: 3 })).toBe(true);
    expect(getPlaylistLockReason({ requiredLevel: 5, state: 'NEW', userLevel: 3 })).toBe('Requires level 5.');
  });

  it('returns false if userLevel >= requiredLevel and state is not LOCKED', () => {
    expect(isPlaylistLocked({ requiredLevel: 2, state: 'TRENDING', userLevel: 2 })).toBe(false);
    expect(getPlaylistLockReason({ requiredLevel: 2, state: 'TRENDING', userLevel: 2 })).toBe(null);
    expect(isPlaylistLocked({ requiredLevel: 2, state: 'NEW', userLevel: 5 })).toBe(false);
    expect(getPlaylistLockReason({ requiredLevel: 2, state: 'NEW', userLevel: 5 })).toBe(null);
  });

  it('returns true and correct reason if both state is LOCKED and userLevel < requiredLevel', () => {
    expect(isPlaylistLocked({ requiredLevel: 10, state: 'LOCKED', userLevel: 1 })).toBe(true);
    expect(getPlaylistLockReason({ requiredLevel: 10, state: 'LOCKED', userLevel: 1 })).toBe('Playlist is locked by admin.');
  });

  it('handles custom/unknown states as unlocked unless LOCKED', () => {
    expect(isPlaylistLocked({ requiredLevel: 1, state: 'CUSTOM', userLevel: 2 })).toBe(false);
    expect(getPlaylistLockReason({ requiredLevel: 1, state: 'CUSTOM', userLevel: 2 })).toBe(null);
  });
}); 