// Leaderboard utility for Guess That Tune

export interface GameResult {
  userId: string;
  score: number;
  userName?: string;
  avatarUrl?: string;
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
  userName?: string;
  avatarUrl?: string;
  rank: number;
}

/**
 * Returns the top N leaderboard entries, sorted by score descending.
 * Ties get the same rank (next rank is skipped, e.g. 1, 2, 2, 4).
 * @param results Array of game results
 * @param topN Number of entries to return (default 10)
 */
export function getLeaderboard(results: GameResult[], topN: number = 10): LeaderboardEntry[] {
  // Sort by score descending, then by userId for stable sort
  const sorted = [...results].sort((a, b) => b.score - a.score || a.userId.localeCompare(b.userId));
  const leaderboard: LeaderboardEntry[] = [];
  let lastScore: number | null = null;
  let lastRank = 0;
  let count = 0;
  for (let i = 0; i < sorted.length && leaderboard.length < topN; i++) {
    const entry = sorted[i];
    if (lastScore === null || entry.score !== lastScore) {
      lastRank = count + 1;
    }
    leaderboard.push({ ...entry, rank: lastRank });
    lastScore = entry.score;
    count++;
  }
  return leaderboard;
} 