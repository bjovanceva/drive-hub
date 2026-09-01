import { DrivingSchoolService } from '../../services/DrivingSchoolService'

/** POST /api/driving-schools validates and persists a new school. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event) ?? {}

  const service = new DrivingSchoolService()

  const school = await service.createDrivingSchool({
    name: body.name,
    email: body.email,
    location: body.location,
    address: body.address,
    city: body.city,
    description: body.description,
    phone: body.phone,
    createdAt: body.createdAt,
    categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds : undefined
  })

  setResponseStatus(event, 201)
  return school
})
