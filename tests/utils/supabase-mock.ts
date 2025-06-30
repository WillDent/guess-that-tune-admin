// Utility to mock Supabase client and user for API tests
export function mockSupabaseClient() {
  // Implement global mocks or jest.mock here as needed
  // Example: jest.mock('@/lib/supabase/client', ...)
}

export function createMockSupabaseUser(overrides = {}) {
  return {
    id: 'test-user-id',
    jwt: 'test-jwt-token',
    email: 'test@example.com',
    ...overrides,
  };
} 