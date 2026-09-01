import { VehicleService } from '../../../services/VehicleService'

/** GET /api/driving-schools/:id/vehicles returns the fleet for a school. */
export default defineEventHandler(async (event) => {
  const schoolId = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid driving school ID'
    })
  }

  const service = new VehicleService()
  const vehicles = await service.getSchoolVehicles(schoolId)

  return vehicles.map(vehicle => ({
    id: vehicle.id,
    registration: vehicle.registration,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    instructorId: vehicle.instructorId,
    instructorName: vehicle.instructor?.name ?? null,
    instructorEmail: vehicle.instructor?.email ?? null
  }))
})
