import { SearchOptionsService } from '../services/SearchOptionsService'

/** GET /api/search-options returns database-backed school-search choices. */
export default defineEventHandler(() => {
  const service = new SearchOptionsService()
  return service.getSchoolSearchOptions()
})
