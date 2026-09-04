import { requireAdmin } from '../../utils/authorization'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  return { user }
})
