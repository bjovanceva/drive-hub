import { VehicleService } from '../../../services/VehicleService'
import { requireSchoolManager } from '../../../utils/authorization'

/** POST /api/driving-schools/:id/vehicles creates a vehicle attached to a school. */
export default defineEventHandler(async (event) => {
  const schoolId = Number(getRouterParam(event, 'id'))
  const body = await readBody(event) ?? {}

  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid driving school ID' })
  }

  await requireSchoolManager(event, schoolId)

  const service = new VehicleService()
  const created = await service.createVehicle({
    drivingSchoolId: schoolId,
    registration: body.registration,
    brand: body.brand,
    model: body.model,
    year: body.year,
    instructorId: body.instructorId
  })

  setResponseStatus(event, 201)
  return {
    id: created.id,
    registration: created.registration,
    brand: created.brand,
    model: created.model,
    year: created.year,
    drivingSchoolId: created.drivingSchoolId,
    instructorId: created.instructorId
  }
})
