import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = await createServerClient();
  const cookieStore = cookies();

  // Get user session from Supabase
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch user profile fields
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, username, avatar_url, level, experience, total_score')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message || 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json(profile);
} 