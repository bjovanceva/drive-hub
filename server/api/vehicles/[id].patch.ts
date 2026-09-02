import { VehicleService } from '../../services/VehicleService'
import prisma from '../../utils/prisma'
import { requireSchoolManager } from '../../utils/authorization'

/** PATCH /api/vehicles/:id updates the assigned instructor on a vehicle. */
export default defineEventHandler(async (event) => {
  const vehicleId = Number(getRouterParam(event, 'id'))
  const body = await readBody(event) ?? {}

  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid vehicle ID'
    })
  }

  const vehicleSchool = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { drivingSchoolId: true }
  })

  if (!vehicleSchool) {
    throw createError({ statusCode: 404, statusMessage: 'Vehicle not found' })
  }

  await requireSchoolManager(event, vehicleSchool.drivingSchoolId)

  const instructorId = body.instructorId == null
    ? null
    : Number(body.instructorId)

  const service = new VehicleService()
  const vehicle = await service.updateVehicleInstructor(vehicleId, instructorId)

  return {
    id: vehicle.id,
    registration: vehicle.registration,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    instructorId: vehicle.instructorId,
    instructorName: vehicle.instructor?.name ?? null,
    instructorEmail: vehicle.instructor?.email ?? null
  }
})
