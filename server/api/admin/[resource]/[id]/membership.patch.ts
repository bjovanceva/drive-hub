import { z } from 'zod'
import { requireAdmin } from '../../../../utils/authorization'
import { AdminService } from '../../../../services/AdminService'
import { adminIdSchema } from '../../../../validation/admin'

const paramsSchema = z.object({ resource: z.literal('users'), id: adminIdSchema })
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  return new AdminService().assignMembership(id, await readBody(event))
})
