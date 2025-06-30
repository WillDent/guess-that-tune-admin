/**
 * @jest-environment node
 */
import * as handler from '../../app/api/home/route';

jest.mock('../../lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}));

describe('/api/home', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('../../lib/supabase/server').createServerClient.mockResolvedValue(mockSupabase);
  });

  it('returns categories and playlists (success)', async () => {
    mockSupabase.from.mockImplementation((table) => ({
      select: jest.fn().mockResolvedValue(
        table === 'categories'
          ? { data: [{ id: 'cat1', name: 'Pop', icon: '🎵' }], error: null }
          : { data: [{ id: 'set1', name: 'Hits', icon: '🔥', state: 'NEW', required_level: 0, unique_players: 1, total_plays: 2 }], error: null }
      ),
    }));

    const response = await handler.GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.categories)).toBe(true);
    expect(Array.isArray(data.playlists)).toBe(true);
  });

  it('returns 500 if Supabase error', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
    });
    const response = await handler.GET();
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('fail');
  });
}); 