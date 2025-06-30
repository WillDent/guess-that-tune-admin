import { z, validate } from '../../lib/validation';

describe('validate', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().int().min(0),
  });

  it('returns success for valid input', () => {
    const result = validate(schema, { name: 'Alice', age: 30 });
    expect(result.success).toBe(true);
    expect(result.errors).toBeNull();
    expect(result.data).toEqual({ name: 'Alice', age: 30 });
  });

  it('returns errors for invalid input', () => {
    const result = validate(schema, { name: 'Bob', age: -5 });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Number must be greater than or equal to 0');
    expect(result.data).toBeNull();
  });

  it('returns errors for missing fields', () => {
    const result = validate(schema, { age: 20 });
    expect(result.success).toBe(false);
    expect(result.errors?.some(e => e.includes('Required'))).toBe(true);
    expect(result.data).toBeNull();
  });

  it('returns multiple errors if multiple fields are invalid', () => {
    const result = validate(schema, { name: 123, age: -1 });
    expect(result.success).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(1);
    expect(result.data).toBeNull();
  });
}); 