import { POST } from '@/app/api/error/log/route';
import { NextResponse } from 'next/server';

jest.mock('@/utils/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('/api/error/log (direct handler)', () => {
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
    const req = new Request('http://localhost:3000/api/error/log', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res instanceof NextResponse).toBe(true);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error');
  });

  it('should accept error log from authenticated user', async () => {
    const fakeUser = { id: 'user-1' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser }, error: null });
    mockSupabase.from.mockReturnValue({
      insert: () => Promise.resolve({ data: [{ id: 1 }], error: null }),
    });
    const reqBody = {
      error_type: 'TypeError',
      error_message: 'Test error',
      device_info: { os: 'iOS', version: '17.0' },
      playlist_id: 123,
    };
    const req = new Request('http://localhost:3000/api/error/log', { method: 'POST', body: JSON.stringify(reqBody), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res instanceof Response).toBe(true);
    expect(res.status).toBe(204);
  });
}); 