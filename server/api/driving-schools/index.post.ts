import { DrivingSchoolService } from '../../services/DrivingSchoolService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const service = new DrivingSchoolService()

  return service.createDrivingSchool({
    name: body.name,
    email: body.email,
    location: body.location,
    address: body.address,
    description: body.description,
    phone: body.phone,
    createdAt: body.createdAt
  })
})