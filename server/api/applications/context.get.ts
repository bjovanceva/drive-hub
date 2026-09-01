import { requireOrdinaryUser } from '../../utils/authorization'

/**
 * First protected application API. Later application and lesson-progress
 * endpoints can build on the returned school relationship context.
 */
export default defineEventHandler(async (event) => {
  const user = await requireOrdinaryUser(event)

  return {
    user,
    context: {
      isStudent: user.studentSchoolId !== null,
      isInstructor: user.instructorSchoolId !== null,
      isManager: user.managedSchoolId !== null
    }
  }
})
