import { GET } from '@/app/api/category/[categoryId]/playlists/route';
import { NextResponse } from 'next/server';

jest.mock('@/utils/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('/api/category/[categoryId]/playlists (direct handler)', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('@/utils/supabase/server').createServerClient.mockResolvedValue(mockSupabase);
  });

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No user' } });
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    });
    const req = new Request('http://localhost:3000/api/category/1/playlists', { method: 'GET' });
    const res = await GET(req, { params: { categoryId: '1' } });
    expect(res instanceof NextResponse).toBe(true);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('should return playlists for authenticated user', async () => {
    const fakeUser = { id: 'user-1' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: [{ id: 1, name: 'Playlist' }], error: null }),
          }),
        }),
      }),
    });
    const req = new Request('http://localhost:3000/api/category/1/playlists', { method: 'GET' });
    const res = await GET(req, { params: { categoryId: '1' } });
    expect(res instanceof NextResponse).toBe(true);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.playlists)).toBe(true);
  });
}); 