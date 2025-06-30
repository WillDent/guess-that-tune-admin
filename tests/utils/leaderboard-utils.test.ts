import { getLeaderboard, GameResult } from '../../lib/leaderboard';

describe('getLeaderboard', () => {
  it('returns top N sorted by score descending', () => {
    const results: GameResult[] = [
      { userId: 'a', score: 100 },
      { userId: 'b', score: 200 },
      { userId: 'c', score: 150 },
    ];
    const leaderboard = getLeaderboard(results, 2);
    expect(leaderboard).toEqual([
      { userId: 'b', score: 200, rank: 1 },
      { userId: 'c', score: 150, rank: 2 },
    ]);
  });

  it('assigns same rank for ties and skips next rank', () => {
    const results: GameResult[] = [
      { userId: 'a', score: 100 },
      { userId: 'b', score: 200 },
      { userId: 'c', score: 200 },
      { userId: 'd', score: 50 },
    ];
    const leaderboard = getLeaderboard(results);
    expect(leaderboard).toEqual([
      { userId: 'b', score: 200, rank: 1 },
      { userId: 'c', score: 200, rank: 1 },
      { userId: 'a', score: 100, rank: 3 },
      { userId: 'd', score: 50, rank: 4 },
    ]);
  });

  it('returns all if less than topN', () => {
    const results: GameResult[] = [
      { userId: 'a', score: 10 },
      { userId: 'b', score: 20 },
    ];
    const leaderboard = getLeaderboard(results, 5);
    expect(leaderboard.length).toBe(2);
  });

  it('returns empty array for no results', () => {
    expect(getLeaderboard([], 5)).toEqual([]);
  });

  it('handles all same score', () => {
    const results: GameResult[] = [
      { userId: 'a', score: 100 },
      { userId: 'b', score: 100 },
      { userId: 'c', score: 100 },
    ];
    const leaderboard = getLeaderboard(results);
    expect(leaderboard.map(e => e.rank)).toEqual([1, 1, 1]);
  });
}); 