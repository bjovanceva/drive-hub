import { UserRepository } from '../../../repositories/UserRepository'
import { restrictManagerToSchool } from '../../../utils/authorization'

/** GET /api/driving-schools/:id/instructors returns instructors provided by a school. */
export default defineEventHandler(async (event) => {
  const schoolId = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid driving school ID' })
  }

  await restrictManagerToSchool(event, schoolId)

  return new UserRepository().findInstructorsBySchoolId(schoolId)
})