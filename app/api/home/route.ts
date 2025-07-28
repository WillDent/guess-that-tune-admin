import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerClient();

  // Fetch categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, icon');

  // Fetch playlists (question sets) with stats
  const { data: playlists, error: setError } = await supabase
    .from('question_sets')
    .select('id, name, state, play_count, question_count, artwork_url');

  if (catError || setError) {
    return NextResponse.json({ error: catError?.message || setError?.message }, { status: 500 });
  }

  return NextResponse.json({
    categories: categories || [],
    playlists: playlists || [],
  });
} 