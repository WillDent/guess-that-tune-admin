import { POST } from '@/app/api/game/complete/route';
import { NextResponse } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('/api/game/complete (direct handler)', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('@/lib/supabase/server').createServerClient.mockResolvedValue(mockSupabase);
  });

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No user' } });
    const req = new Request('http://localhost:3000/api/game/complete', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res instanceof NextResponse).toBe(true);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('should accept game result and return stats for authenticated user', async () => {
    const fakeUser = { id: 'user-1' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    // Mock for user profile fetch
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: 'user-1', experience: 0, total_score: 0, level: 1 }, error: null }),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ data: [{ id: 'user-1' }], error: null }) }),
        };
      }
      if (table === 'game_results') {
        return {
          insert: () => Promise.resolve({ data: [{ id: 1 }], error: null }),
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: [], error: null }), // prevResults
              order: () => Promise.resolve({ data: [{ user_id: 'user-1', score_awarded: 200 }], error: null }), // leaderboardData
            }),
          }),
        };
      }
      return {};
    });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    const reqBody = {
      playlist_id: 1,
      correct_tracks: 2,
      total_tracks: 2,
      completion_time: 120,
      perfect_score: true,
    };
    const req = new Request('http://localhost:3000/api/game/complete', { method: 'POST', body: JSON.stringify(reqBody), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res instanceof NextResponse).toBe(true);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('xp_awarded');
    expect(json).toHaveProperty('score_awarded');
    expect(json).toHaveProperty('new_level');
    expect(json).toHaveProperty('leaderboard_position');
  });
}); 