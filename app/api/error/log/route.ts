import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { z, validate } from '@/lib/validation';

const RATE_LIMIT = 5; // max 5 logs per user per minute
const WINDOW_MS = 60 * 1000;

const ErrorLogSchema = z.object({
  error_type: z.string(),
  playlist_id: z.string().optional(),
  error_message: z.string(),
  device_info: z.any(),
});

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
  if (!rateLimit(user.id, RATE_LIMIT, WINDOW_MS)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Input validation
  const result = validate(ErrorLogSchema, body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid input', details: result.errors }, { status: 400 });
  }
  const { error_type, playlist_id, error_message, device_info } = result.data!;

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