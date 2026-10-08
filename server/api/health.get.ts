import prisma from '../utils/prisma'

/** Readiness check for the application and its database connection. */
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok' }
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Service unavailable' })
  }
})
