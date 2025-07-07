import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createServerClient();

  // Extract categoryId from the URL pathname
  const pathname = new URL(request.url).pathname;
  // /api/category/{categoryId}/playlists
  const match = pathname.match(/\/api\/category\/([^/]+)\/playlists/);
  const categoryId = match ? match[1] : undefined;

  // Authentication check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  if (!categoryId) {
    return NextResponse.json({ error: 'Missing categoryId' }, { status: 400 });
  }

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get all question_set_ids for this category
  const { data: setIds, error: setIdsError } = await supabase
    .from('question_set_categories')
    .select('question_set_id')
    .eq('category_id', categoryId);

  if (setIdsError) {
    return NextResponse.json({ error: setIdsError.message }, { status: 500 });
  }

  const questionSetIds = setIds?.map((row: any) => row.question_set_id) || [];

  if (questionSetIds.length === 0) {
    return NextResponse.json({ playlists: [], page, pageSize, total: 0 });
  }

  // Fetch paginated playlists (question sets)
  const { data: playlists, error: playlistsError, count } = await supabase
    .from('question_sets')
    .select('id, name, icon, state, required_level, unique_players, total_plays', { count: 'exact' })
    .in('id', questionSetIds)
    .range(from, to);

  if (playlistsError) {
    return NextResponse.json({ error: playlistsError.message }, { status: 500 });
  }

  return NextResponse.json({
    playlists: playlists || [],
    page,
    pageSize,
    total: count || 0,
  });
} 