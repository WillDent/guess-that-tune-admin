import { GET as userProfileHandler } from '../../app/api/user/profile/route'
import { GET as adminUsersHandler } from '../../app/api/admin/users/route'

// Mock Supabase client creation and auth
jest.mock('../../lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}))

const { createServerClient } = require('../../lib/supabase/server')

function mockNextRequest(url: string) {
  return {
    url,
    headers: new Headers(),
    cookies: { get: () => undefined },
    nextUrl: { pathname: new URL(url).pathname },
    method: 'GET',
  }
}

describe('Auth Integration', () => {
  describe('User endpoint: /api/user/profile', () => {
    it('returns 401 if unauthenticated', async () => {
      createServerClient.mockReturnValue({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      })
      const req = new Request('http://localhost/api/user/profile') as any
      const res = await userProfileHandler(req)
      expect(res.status).toBe(401)
    })
    it('returns 200 if authenticated', async () => {
      createServerClient.mockReturnValue({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'u1', email: 'test@example.com', level: 1, experience: 0, total_score: 0 } }),
      })
      const req = new Request('http://localhost/api/user/profile') as any
      const res = await userProfileHandler(req)
      expect(res.status).toBe(200)
    })
  })

  describe('Admin endpoint: /api/admin/users', () => {
    it('returns 401 if unauthenticated', async () => {
      createServerClient.mockReturnValue({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      })
      const req = new Request('http://localhost/api/admin/users') as any
      const res = await adminUsersHandler(req)
      expect(res.status).toBe(401)
    })
    it('returns 401 or 403 if authenticated but not admin', async () => {
      createServerClient.mockReturnValue({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u2' } }, error: null }) },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role: 'user' } }),
      })
      const req = new Request('http://localhost/api/admin/users') as any
      const res = await adminUsersHandler(req)
      expect([401, 403]).toContain(res.status)
    })
    it('returns 200 if authenticated as admin', async () => {
      createServerClient.mockReturnValue({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'admin1' } }, error: null }) },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role: 'admin' } }),
      })
      const req = new Request('http://localhost/api/admin/users') as any
      const res = await adminUsersHandler(req)
      expect(res.status).toBe(200)
    })
  })
}) 