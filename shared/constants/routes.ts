/** Public authentication routes for ordinary Drive Hub users. */
export const authRoutes = {
  login: '/login',
  register: '/register'
} as const

/** Directory and school-management routes. */
export const schoolRoutes = {
  list: '/schools',
  create: '/schools/create'
} as const

/** Routes that require an authenticated USER session. */
export const userRoutes = {
  startApplication: '/start-application'
} as const

/** Reserved paths for the future, separately authenticated admin panel. */
export const futureAdminRoutes = {
  login: '/admin/login',
  dashboard: '/admin'
} as const
