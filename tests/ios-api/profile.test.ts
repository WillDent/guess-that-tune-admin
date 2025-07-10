import { GET } from '@/app/api/user/profile/route';
import { NextResponse } from 'next/server';

jest.mock('@/utils/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('/api/user/profile (direct handler)', () => {
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
    const res = await GET();
    expect(res instanceof NextResponse).toBe(true);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('should return user profile for authenticated user', async () => {
    const fakeUser = { id: 'user-1' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'user-1', username: 'test', avatar_url: '', level: 1, experience: 0, total_score: 0 }, error: null }),
        }),
      }),
    });
    const res = await GET();
    expect(res instanceof NextResponse).toBe(true);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('id', 'user-1');
    expect(json).toHaveProperty('username', 'test');
  });
}); 