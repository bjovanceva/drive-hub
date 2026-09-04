import { requireAdmin } from '../../../utils/authorization'
import { AdminService } from '../../../services/AdminService'
import { adminResourceParamsSchema } from '../../../validation/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { resource } = await getValidatedRouterParams(event, adminResourceParamsSchema.parse)
  const result = await new AdminService().save(resource, null, await readBody(event))
  setResponseStatus(event, 201)
  return result
})
