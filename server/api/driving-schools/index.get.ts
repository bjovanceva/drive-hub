import { DrivingSchoolService } from '../../services/DrivingSchoolService'

function queryValue(value: unknown) {
  return typeof value === 'string' && value.trim() && value !== 'all'
    ? value.trim()
    : undefined
}

/** GET /api/driving-schools supports optional location and category filters. */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const service = new DrivingSchoolService()

  return service.getAllDrivingSchools({
    location: queryValue(query.location),
    category: queryValue(query.category)
  })
})
