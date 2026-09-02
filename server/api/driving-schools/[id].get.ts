import { DrivingSchoolService } from '../../services/DrivingSchoolService'
import { restrictManagerToSchool } from '../../utils/authorization'

/** GET /api/driving-schools/:id returns one school with its categories. */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid ID'
    })
  }

  await restrictManagerToSchool(event, id)

  const service = new DrivingSchoolService()

  return service.getDrivingSchool(id)
})
