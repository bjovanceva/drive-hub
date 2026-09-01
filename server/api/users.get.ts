import { UserRepository } from '../repositories/UserRepository'

/** GET /api/users returns all users available for school-manager assignment. */
export default defineEventHandler(async () => {
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
