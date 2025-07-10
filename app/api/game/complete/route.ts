import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { z, validate } from '@/lib/validation';
import { calculateXPLevel } from '@/lib/xp';
import { updateTotalPlays, updateUniquePlayers } from '@/lib/stats';
import { getLeaderboard } from '@/lib/leaderboard';
import { rateLimit } from '@/lib/rate-limit';

const GameCompleteSchema = z.object({
  playlist_id: z.string(),
  correct_tracks: z.number().int().min(0),
  total_tracks: z.number().int().min(1),
  completion_time: z.number().int().min(0),
  perfect_score: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    // Validate input
    const { success, errors, data } = validate(GameCompleteSchema, body);
    if (!success || !data) {
      return NextResponse.json({ error: 'Invalid input', details: errors }, { status: 400 });
    }
    const { playlist_id, correct_tracks, total_tracks, completion_time, perfect_score } = data;

    // Get user session from Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 10 requests per minute per user
    const allowed = rateLimit(user.id, 10, 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait before submitting again.' }, { status: 429 });
    }

    // XP/score logic
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
    const xpResult = calculateXPLevel(userProfile.experience || 0, userProfile.level || 1, xp_awarded);
    const newScore = (userProfile.total_score || 0) + score_awarded;
    await supabase
      .from('users')
      .update({ experience: xpResult.newXP, total_score: newScore, level: xpResult.newLevel })
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
    await supabase.rpc('increment_playlist_stats', {
      playlist_id,
      total_plays_inc: 1,
      unique_players_inc: isFirstPlay ? 1 : 0,
    });

    // Get leaderboard position using shared utility
    const { data: leaderboardData } = await supabase
      .from('game_results')
      .select('user_id, score_awarded')
      .eq('playlist_id', playlist_id)
      .order('score_awarded', { ascending: false });
    let leaderboard_position = 0;
    if (leaderboardData) {
      const results = leaderboardData.map((entry: any) => ({
        userId: entry.user_id,
        score: entry.score_awarded,
      }));
      const leaderboard = getLeaderboard(results, leaderboardData.length);
      leaderboard_position = leaderboard.findIndex(e => e.userId === user.id) + 1;
    }

    return NextResponse.json({
      xp_awarded,
      score_awarded,
      new_level: xpResult.newLevel,
      leaderboard_position,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error', details: err?.message }, { status: 500 });
  }
} 