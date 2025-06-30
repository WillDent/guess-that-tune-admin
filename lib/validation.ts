import { z, ZodSchema, ZodError } from 'zod'

export { z }

export function validate<T>(schema: ZodSchema<T>, data: unknown): { success: boolean; errors: string[] | null; data: T | null } {
  try {
    const parsed = schema.parse(data)
    return { success: true, errors: null, data: parsed }
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        success: false,
        errors: err.errors.map(e => e.message),
        data: null,
      }
    }
    throw err
  }
} 