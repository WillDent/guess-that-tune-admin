import { GET } from '@/app/api/playlist/[playlistId]/route';
import { NextResponse } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('/api/playlist/[playlistId] (direct handler)', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('@/lib/supabase/server').createServerClient.mockResolvedValue(mockSupabase);
  });

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No user' } });
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });
    const req = new Request('http://localhost:3000/api/playlist/1', { method: 'GET' });
    const res = await GET(req, { params: { playlistId: '1' } });
    expect(res instanceof NextResponse).toBe(true);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('should return playlist details for authenticated user', async () => {
    const fakeUser = { id: 'user-1' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'question_sets') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: 1, name: 'Playlist', icon: '', state: 'NEW', required_level: 0, unique_players: 1, total_plays: 2 }, error: null }),
            }),
          }),
        };
      } else if (table === 'game_results') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [{ user_id: 'user-1', score_awarded: 100 }], error: null }),
              }),
            }),
          }),
        };
      } else if (table === 'users') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [{ id: 'user-1', username: 'testuser' }], error: null }),
          }),
        };
      }
      return {};
    });
    const req = new Request('http://localhost:3000/api/playlist/1', { method: 'GET' });
    const res = await GET(req, { params: { playlistId: '1' } });
    expect(res instanceof NextResponse).toBe(true);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('playlist');
    expect(json.playlist).toHaveProperty('id', 1);
    expect(json.playlist).toHaveProperty('name', 'Playlist');
    expect(Array.isArray(json.leaderboard)).toBe(true);
    expect(json.leaderboard[0]).toHaveProperty('username', 'testuser');
  });
}); 