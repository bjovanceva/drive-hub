import { UserRepository } from '../repositories/UserRepository'
import { requireAdmin } from '../utils/authorization'

/** GET /api/users returns all users available for school-manager assignment. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const repository = new UserRepository()
  const users = await repository.findAllForSelection()

  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    managedSchool: user.managedSchool
  }))
})
