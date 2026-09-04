import { requireAdmin } from '../../../utils/authorization'
import { AdminService } from '../../../services/AdminService'
import { adminEntityParamsSchema } from '../../../validation/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { resource, id } = await getValidatedRouterParams(event, adminEntityParamsSchema.parse)
  return new AdminService().save(resource, id, await readBody(event))
})
