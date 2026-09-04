import { requireAdmin } from '../../utils/authorization'
import { AdminService } from '../../services/AdminService'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return new AdminService().overview()
})
