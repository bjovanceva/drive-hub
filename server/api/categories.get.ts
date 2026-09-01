import { CategoryRepository } from '../repositories/CategoryRepository'

/** GET /api/categories returns the database category catalog for school and vehicle forms. */
export default defineEventHandler(async () => {
  const repository = new CategoryRepository()
  return repository.findAllForSelection()
})
