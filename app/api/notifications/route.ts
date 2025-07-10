import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createServerClient();

  // Get user session from Supabase
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch notifications for user
  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (notifError) {
    return NextResponse.json({ error: notifError.message }, { status: 500 });
  }

  // Count unread notifications
  const unread_count = notifications?.filter((n: any) => !n.is_read).length || 0;

  return NextResponse.json({
    notifications: notifications || [],
    unread_count,
  });
} 