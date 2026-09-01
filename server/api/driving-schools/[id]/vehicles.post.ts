import { VehicleService } from '../../../services/VehicleService'

/** POST /api/driving-schools/:id/vehicles creates a vehicle attached to a school. */
export default defineEventHandler(async (event) => {
  const schoolId = Number(getRouterParam(event, 'id'))
  const body = await readBody(event) ?? {}

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
