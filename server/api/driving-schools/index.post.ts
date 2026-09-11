import { DrivingSchoolService } from '../../services/DrivingSchoolService'
import { requireAdmin } from '../../utils/authorization'

/** Legacy admin-compatible creation endpoint; no public directory UI exposes it. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event) ?? {}
  const school = await new DrivingSchoolService().createDrivingSchool({
    name: body.name,
    email: body.email,
    address: body.address,
    city: body.city,
    description: body.description,
    phone: body.phone,
    managerId: body.managerId,
    createdAt: body.createdAt,
    categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds : undefined
  })
  setResponseStatus(event, 201)
  return school
})
