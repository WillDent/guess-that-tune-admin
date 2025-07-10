import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

// NOTE: Next.js App Router API routes do not support a second argument for params.
// Dynamic params must be extracted from the URL.
export async function GET(request: Request) {
  const supabase = await createServerClient();

  // Extract playlistId from the URL pathname
  const pathname = new URL(request.url).pathname;
  // /api/playlist/{playlistId}
  const match = pathname.match(/\/api\/playlist\/([^/]+)/);
  const playlistId = match ? match[1] : undefined;

  // Authentication check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!playlistId) {
    return NextResponse.json({ error: 'Missing playlistId' }, { status: 400 });
  }

  // Fetch playlist (question set) detail
  const { data: playlist, error: playlistError } = await supabase
    .from('question_sets')
    .select('id, name, icon, state, required_level, unique_players, total_plays')
    .eq('id', playlistId)
    .single();

  if (playlistError || !playlist) {
    return NextResponse.json({ error: playlistError?.message || 'Playlist not found' }, { status: 404 });
  }

  // Fetch leaderboard (top 10 scores for this playlist)
  const { data: leaderboardData, error: leaderboardError } = await supabase
    .from('game_results')
    .select('user_id, score_awarded')
    .eq('playlist_id', playlistId)
    .order('score_awarded', { ascending: false })
    .limit(10);

  if (leaderboardError) {
    return NextResponse.json({ error: leaderboardError.message }, { status: 500 });
  }

  // Fetch usernames for leaderboard
  let leaderboard: {
    user_id: string
    username: string
    score: number
    rank: number
  }[] = [];
  if (leaderboardData && leaderboardData.length > 0) {
    const userIds = leaderboardData.map((entry: any) => entry.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds);
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    leaderboard = leaderboardData.map((entry: any, idx: number) => {
      const user = users?.find((u: any) => u.id === entry.user_id);
      return {
        user_id: entry.user_id,
        username: user?.username || '',
        score: entry.score_awarded,
        rank: idx + 1,
      };
    });
  }

  return NextResponse.json({
    playlist,
    leaderboard,
  });
} 