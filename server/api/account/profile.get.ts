import { requireOrdinaryUser } from '../../utils/authorization'
import { UserRepository } from '../../repositories/UserRepository'

export default defineEventHandler(async (event) => {
  const user = await requireOrdinaryUser(event)
  const contact = await new UserRepository().findContactById(user.id)
  return { user: { ...user, phone: contact?.phone ?? null } }
})
