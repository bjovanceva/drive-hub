import { createError, readBody, type H3Event } from 'h3'
import type { ZodType } from 'zod'

/** Return readable field errors instead of h3's generic "Validation Error". */
export async function readAuthBody<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const result = schema.safeParse(await readBody(event))
  if (result.success) return result.data

  const fieldErrors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && !(field in fieldErrors)) fieldErrors[field] = issue.message
  }
  throw createError({
    statusCode: 400,
    statusMessage: Object.values(fieldErrors)[0] || 'Check the account details and try again',
    data: { fieldErrors }
  })
}
