import { ManagerService } from '../../../../services/ManagerService'
import { requireSchoolManager } from '../../../../utils/authorization'
import { managerIdParamsSchema } from '../../../../validation/manager'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const schoolId = session.user.managedSchoolId
  if (schoolId === null) throw createError({ statusCode: 403, statusMessage: 'Manager access required' })
  await requireSchoolManager(event, schoolId)
  const { id } = await getValidatedRouterParams(event, managerIdParamsSchema.parse)
  return new ManagerService().approveApplication(schoolId, id, await readBody(event))
})
