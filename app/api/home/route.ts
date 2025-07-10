import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createServerClient();

  // Fetch categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, icon');

  // Fetch playlists (question sets) with stats
  const { data: playlists, error: setError } = await supabase
    .from('question_sets')
    .select('id, name, icon, state, required_level, unique_players, total_plays');

  if (catError || setError) {
    return NextResponse.json({ error: catError?.message || setError?.message }, { status: 500 });
  }

  return NextResponse.json({
    categories: categories || [],
    playlists: playlists || [],
  });
} 