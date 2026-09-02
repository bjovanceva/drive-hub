import { ApplicationService } from '../../services/ApplicationService'
import { requireOrdinaryUser } from '../../utils/authorization'

/** POST /api/applications creates an application for the current user. */
export default defineEventHandler(async (event) => {
  const user = await requireOrdinaryUser(event)
  const body = await readBody<{ drivingSchoolId?: unknown, categoryId?: unknown, preferredInstructorId?: unknown }>(event)

  return new ApplicationService().createApplication(
    user.id,
    body?.drivingSchoolId,
    body?.categoryId,
    body?.preferredInstructorId
  )
})