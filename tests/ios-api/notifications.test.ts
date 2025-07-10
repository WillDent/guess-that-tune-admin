import { GET } from '@/app/api/notifications/route';
import { NextResponse } from 'next/server';

jest.mock('@/utils/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('/api/notifications (direct handler)', () => {
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

  it('should return notifications for authenticated user', async () => {
    const fakeUser = { id: 'user-1' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [{ id: 1, message: 'Test notification' }], error: null }),
          }),
        }),
      }),
    });
    const res = await GET();
    expect(res instanceof NextResponse).toBe(true);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.notifications)).toBe(true);
  });
}); 