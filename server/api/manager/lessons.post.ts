import { ManagerService } from '../../services/ManagerService'
import { requireSchoolManager } from '../../utils/authorization'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const schoolId = session.user.managedSchoolId
  if (schoolId === null) throw createError({ statusCode: 403, statusMessage: 'Manager access required' })
  await requireSchoolManager(event, schoolId)
  return new ManagerService().scheduleLesson(schoolId, await readBody(event))
})
