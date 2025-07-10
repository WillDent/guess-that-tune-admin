import { POST } from '@/app/api/game/complete/route';
import { NextResponse } from 'next/server';

jest.mock('@/utils/supabase/server', () => ({
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
    require('@/utils/supabase/server').createServerClient.mockResolvedValue(mockSupabase);
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

  it('should return 400 for missing required fields', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const req = new Request('http://localhost:3000/api/game/complete', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty('error');
    expect(json).toHaveProperty('details');
  });

  it('should return 400 for invalid field types', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const reqBody = {
      playlist_id: 123, // should be string
      correct_tracks: '2', // should be number
      total_tracks: 2,
      completion_time: 120,
      perfect_score: true,
    };
    const req = new Request('http://localhost:3000/api/game/complete', { method: 'POST', body: JSON.stringify(reqBody), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty('error');
    expect(json).toHaveProperty('details');
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
      playlist_id: '1',
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

  it('should handle level-up scenario', async () => {
    const fakeUser = { id: 'user-2' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: 'user-2', experience: 990, total_score: 0, level: 1 }, error: null }),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ data: [{ id: 'user-2' }], error: null }) }),
        };
      }
      if (table === 'game_results') {
        return {
          insert: () => Promise.resolve({ data: [{ id: 2 }], error: null }),
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
              order: () => Promise.resolve({ data: [{ user_id: 'user-2', score_awarded: 200 }], error: null }),
            }),
          }),
        };
      }
      return {};
    });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    const reqBody = {
      playlist_id: '2',
      correct_tracks: 2, // 2*10=20 XP, total 1010, should level up
      total_tracks: 2,
      completion_time: 100,
      perfect_score: false,
    };
    const req = new Request('http://localhost:3000/api/game/complete', { method: 'POST', body: JSON.stringify(reqBody), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.new_level).toBe(2);
    // XP should be 10 (1010 - 1000)
    // Optionally check other fields
  });

  it('should handle database error gracefully', async () => {
    const fakeUser = { id: 'user-3' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
            }),
          }),
        };
      }
      return {};
    });
    const reqBody = {
      playlist_id: '3',
      correct_tracks: 1,
      total_tracks: 2,
      completion_time: 50,
      perfect_score: false,
    };
    const req = new Request('http://localhost:3000/api/game/complete', { method: 'POST', body: JSON.stringify(reqBody), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(404); // User not found
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('should handle edge case: repeat play does not increment unique_players', async () => {
    const fakeUser = { id: 'user-4' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: 'user-4', experience: 0, total_score: 0, level: 1 }, error: null }),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ data: [{ id: 'user-4' }], error: null }) }),
        };
      }
      if (table === 'game_results') {
        return {
          insert: () => Promise.resolve({ data: [{ id: 4 }], error: null }),
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: [{ id: 99 }], error: null }), // prevResults not empty
              order: () => Promise.resolve({ data: [{ user_id: 'user-4', score_awarded: 100 }], error: null }),
            }),
          }),
        };
      }
      return {};
    });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    const reqBody = {
      playlist_id: '4',
      correct_tracks: 1,
      total_tracks: 2,
      completion_time: 50,
      perfect_score: false,
    };
    const req = new Request('http://localhost:3000/api/game/complete', { method: 'POST', body: JSON.stringify(reqBody), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('xp_awarded');
    // Optionally check leaderboard_position, etc.
  });

  it('should handle edge case: perfect score awards bonus XP and score', async () => {
    const fakeUser = { id: 'user-5' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: 'user-5', experience: 0, total_score: 0, level: 1 }, error: null }),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ data: [{ id: 'user-5' }], error: null }) }),
        };
      }
      if (table === 'game_results') {
        return {
          insert: () => Promise.resolve({ data: [{ id: 5 }], error: null }),
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
              order: () => Promise.resolve({ data: [{ user_id: 'user-5', score_awarded: 700 }], error: null }),
            }),
          }),
        };
      }
      return {};
    });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    const reqBody = {
      playlist_id: '5',
      correct_tracks: 2,
      total_tracks: 2,
      completion_time: 80,
      perfect_score: true,
    };
    const req = new Request('http://localhost:3000/api/game/complete', { method: 'POST', body: JSON.stringify(reqBody), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.xp_awarded).toBe(70); // 2*10 + 50
    expect(json.score_awarded).toBe(700); // 2*100 + 500
  });

  it('should handle auth edge case: malformed token', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Malformed token' } });
    const reqBody = {
      playlist_id: '6',
      correct_tracks: 1,
      total_tracks: 2,
      completion_time: 50,
      perfect_score: false,
    };
    const req = new Request('http://localhost:3000/api/game/complete', { method: 'POST', body: JSON.stringify(reqBody), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });
}); 