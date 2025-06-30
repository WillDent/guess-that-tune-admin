import { calculateXPLevel } from '../../lib/xp';

describe('calculateXPLevel', () => {
  it('returns same level if XP does not reach threshold', () => {
    const result = calculateXPLevel(500, 1, 200);
    expect(result).toEqual({ newXP: 700, newLevel: 1 });
  });

  it('levels up once if XP crosses threshold', () => {
    const result = calculateXPLevel(900, 1, 200);
    // 900 + 200 = 1100, level 1 threshold is 1000, so level up to 2, 1100-1000=100 XP left
    expect(result).toEqual({ newXP: 100, newLevel: 2 });
  });

  it('levels up multiple times if XP is high enough', () => {
    // Level 1: 900 + 3000 = 3900
    // Level 1: 1000 -> 2900 left, level 2
    // Level 2: 2000 -> 900 left, level 3
    const result = calculateXPLevel(900, 1, 3000);
    expect(result).toEqual({ newXP: 900, newLevel: 3 });
  });

  it('handles zero XP to add', () => {
    const result = calculateXPLevel(500, 1, 0);
    expect(result).toEqual({ newXP: 500, newLevel: 1 });
  });

  it('handles exact threshold for level up', () => {
    const result = calculateXPLevel(500, 1, 500);
    expect(result).toEqual({ newXP: 0, newLevel: 2 });
  });
}); 