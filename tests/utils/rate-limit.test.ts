import { rateLimit, clearRateLimitStore } from '../../lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    clearRateLimitStore();
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows up to the limit', () => {
    for (let i = 0; i < 5; i++) {
      expect(rateLimit('user1', 5, 1000)).toBe(true);
    }
  });

  it('blocks after the limit', () => {
    for (let i = 0; i < 5; i++) rateLimit('user2', 5, 1000);
    expect(rateLimit('user2', 5, 1000)).toBe(false);
  });

  it('resets after windowMs', () => {
    for (let i = 0; i < 5; i++) rateLimit('user3', 5, 1000);
    expect(rateLimit('user3', 5, 1000)).toBe(false);
    jest.advanceTimersByTime(1001);
    expect(rateLimit('user3', 5, 1000)).toBe(true);
  });

  it('is per key', () => {
    for (let i = 0; i < 5; i++) rateLimit('userA', 5, 1000);
    for (let i = 0; i < 5; i++) expect(rateLimit('userB', 5, 1000)).toBe(true);
    expect(rateLimit('userA', 5, 1000)).toBe(false);
    expect(rateLimit('userB', 5, 1000)).toBe(false);
  });

  it('clearRateLimitStore resets all', () => {
    for (let i = 0; i < 5; i++) rateLimit('userX', 5, 1000);
    expect(rateLimit('userX', 5, 1000)).toBe(false);
    clearRateLimitStore();
    expect(rateLimit('userX', 5, 1000)).toBe(true);
  });
}); 