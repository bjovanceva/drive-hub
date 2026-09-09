import { DashboardService } from '../services/DashboardService'
import { requireOrdinaryUser } from '../utils/authorization'

/** Returns only dashboard data belonging to the currently authenticated user. */
export default defineEventHandler(async (event) => {
  const user = await requireOrdinaryUser(event)
  return new DashboardService().overview(user)
})
