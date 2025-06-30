import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const body = await request.json();

  // Get user session from Supabase
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { playlist_id, correct_tracks, total_tracks, completion_time, perfect_score } = body;
  if (!playlist_id || typeof correct_tracks !== 'number' || typeof total_tracks !== 'number') {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  // XP/score logic (simple example)
  const baseXP = 10;
  const xp_awarded = baseXP * correct_tracks + (perfect_score ? 50 : 0);
  const score_awarded = correct_tracks * 100 + (perfect_score ? 500 : 0);

  // Update user XP, score, and level
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('id, experience, total_score, level')
    .eq('id', user.id)
    .single();
  if (profileError || !userProfile) {
    return NextResponse.json({ error: profileError?.message || 'User not found' }, { status: 404 });
  }
  let newXP = (userProfile.experience || 0) + xp_awarded;
  let newScore = (userProfile.total_score || 0) + score_awarded;
  let newLevel = userProfile.level || 1;
  // Level up for every 1000 XP (example)
  while (newXP >= newLevel * 1000) {
    newXP -= newLevel * 1000;
    newLevel += 1;
  }
  await supabase
    .from('users')
    .update({ experience: newXP, total_score: newScore, level: newLevel })
    .eq('id', user.id);

  // Insert game result
  await supabase.from('game_results').insert({
    user_id: user.id,
    playlist_id,
    correct_tracks,
    total_tracks,
    completion_time,
    perfect_score,
    score_awarded,
    xp_awarded,
  });

  // Update playlist stats
  // Increment total_plays, and unique_players if first time
  const { data: prevResults } = await supabase
    .from('game_results')
    .select('id')
    .eq('user_id', user.id)
    .eq('playlist_id', playlist_id);
  const isFirstPlay = prevResults && prevResults.length === 0;
  const updates: any = { total_plays: { increment: 1 } };
  if (isFirstPlay) updates.unique_players = { increment: 1 };
  await supabase.rpc('increment_playlist_stats', {
    playlist_id,
    total_plays_inc: 1,
    unique_players_inc: isFirstPlay ? 1 : 0,
  });

  // Get leaderboard position
  const { data: leaderboardData } = await supabase
    .from('game_results')
    .select('user_id, score_awarded')
    .eq('playlist_id', playlist_id)
    .order('score_awarded', { ascending: false });
  let leaderboard_position = 0;
  if (leaderboardData) {
    leaderboard_position = leaderboardData.findIndex((entry: any) => entry.user_id === user.id) + 1;
  }

  return NextResponse.json({
    xp_awarded,
    score_awarded,
    new_level: newLevel,
    leaderboard_position,
  });
} 