import { DrivingSchoolService } from '../../services/DrivingSchoolService'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid ID'
    })
  }

  const service = new DrivingSchoolService()

  return service.getDrivingSchool(id)
})