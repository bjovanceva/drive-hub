import { getAuthenticatedUser } from '../../../utils/authorization'
import { UserRepository } from '../../../repositories/UserRepository'

export default defineEventHandler(async (event) => {
  if (!await getAuthenticatedUser(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid user ID' })
  }
  const contact = await new UserRepository().findContactById(id)
  if (!contact) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  setHeader(event, 'Cache-Control', 'private, no-store')
  return contact
})
