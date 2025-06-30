import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Simple in-memory rate limit store (for demonstration; use Redis or similar in production)
const rateLimitMap = new Map();
const RATE_LIMIT = 5; // max 5 logs per user per minute

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

  // Rate limiting (per user, per minute)
  const now = Date.now();
  const windowStart = now - 60 * 1000;
  const logs = rateLimitMap.get(user.id) || [];
  const recentLogs = logs.filter((ts: number) => ts > windowStart);
  if (recentLogs.length >= RATE_LIMIT) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  recentLogs.push(now);
  rateLimitMap.set(user.id, recentLogs);

  const { error_type, playlist_id, error_message, device_info } = body;
  if (!error_type || !error_message || !device_info) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await supabase.from('error_logs').insert({
    user_id: user.id,
    error_type,
    playlist_id,
    error_message,
    device_info,
    timestamp: new Date().toISOString(),
  });

  return new Response(null, { status: 204 });
} 