import { DrivingSchoolService } from '../../services/DrivingSchoolService'
import { getAuthenticatedOrdinaryUser } from '../../utils/authorization'

function queryValue(value: unknown) {
  return typeof value === 'string' && value.trim() && value !== 'all'
    ? value.trim()
    : undefined
}

/** GET /api/driving-schools supports optional location and category filters. */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const service = new DrivingSchoolService()

  const schools = await service.getAllDrivingSchools({
    location: queryValue(query.location),
    category: queryValue(query.category)
  })

  const user = await getAuthenticatedOrdinaryUser(event)
  return user?.managedSchoolId
    ? schools.filter(school => school.id === user.managedSchoolId)
    : schools
})
