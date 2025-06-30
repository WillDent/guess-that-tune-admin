import { updateTotalPlays, updateUniquePlayers, getUniquePlayerCount } from '../../lib/stats';

describe('Stats tracking utility', () => {
  describe('updateTotalPlays', () => {
    it('increments total plays by 1', () => {
      expect(updateTotalPlays(0)).toBe(1);
      expect(updateTotalPlays(5)).toBe(6);
    });
  });

  describe('updateUniquePlayers', () => {
    it('adds new playerId to set and returns updated count', () => {
      const set = new Set(['a', 'b']);
      const { set: updatedSet, count } = updateUniquePlayers(set, 'c');
      expect(updatedSet.has('c')).toBe(true);
      expect(count).toBe(3);
    });
    it('does not add duplicate playerId', () => {
      const set = new Set(['a', 'b']);
      const { set: updatedSet, count } = updateUniquePlayers(set, 'a');
      expect(updatedSet.size).toBe(2);
      expect(count).toBe(2);
    });
    it('works with empty set', () => {
      const { set: updatedSet, count } = updateUniquePlayers(new Set(), 'x');
      expect(updatedSet.has('x')).toBe(true);
      expect(count).toBe(1);
    });
  });

  describe('getUniquePlayerCount', () => {
    it('returns unique count from array', () => {
      expect(getUniquePlayerCount(['a', 'b', 'a', 'c'])).toBe(3);
      expect(getUniquePlayerCount(['x', 'x', 'x'])).toBe(1);
      expect(getUniquePlayerCount([])).toBe(0);
    });
  });
}); 