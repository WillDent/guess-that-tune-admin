import { NextRequest, NextResponse } from 'next/server';
import { requireAuthRoute, handleSupabaseError } from '@/utils/supabase';

export async function GET(req: NextRequest) {
  return requireAuthRoute(req, async (user, supabase) => {
    // Fetch user profile fields
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, username, avatar_url, level, experience, total_score')
      .eq('id', user.id)
      .single();

    if (profileError) {
      const handledError = handleSupabaseError(profileError);
      return NextResponse.json(
        { error: handledError.message },
        { status: handledError.type === 'not_found' ? 404 : 500 }
      );
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  });
} 