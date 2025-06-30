import { requireAuth, requireAdmin } from '../../lib/auth/require-auth';
import { AuthError } from '../../lib/errors/types';

describe('requireAuth', () => {
  it('throws AuthError if not authenticated', async () => {
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    };
    await expect(requireAuth(supabase)).rejects.toThrow(AuthError);
  });
  it('returns user if authenticated', async () => {
    const user = { id: 'u1' };
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
    };
    await expect(requireAuth(supabase)).resolves.toBe(user);
  });
});

describe('requireAdmin', () => {
  it('throws AuthError if not authenticated', async () => {
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    };
    await expect(requireAdmin(supabase)).rejects.toThrow(AuthError);
  });
  it('throws AuthError if not admin', async () => {
    const user = { id: 'u2' };
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { role: 'user' } }),
    };
    await expect(requireAdmin(supabase)).rejects.toThrow(AuthError);
  });
  it('returns user if admin', async () => {
    const user = { id: 'u3' };
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { role: 'admin' } }),
    };
    await expect(requireAdmin(supabase)).resolves.toBe(user);
  });
}); 