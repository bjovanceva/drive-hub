import { DrivingSchoolService } from '../../services/DrivingSchoolService'

/** DELETE /api/driving-schools/:id removes a school when no restricted relations remain. */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid ID'
    })
  }

  const service = new DrivingSchoolService()
  return service.deleteDrivingSchool(id)
})
