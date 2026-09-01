/** Public authentication routes for ordinary Drive Hub users. */
export const authRoutes = {
  login: '/login',
  register: '/register'
} as const

/** Directory and school-management routes. */
export const schoolRoutes = {
  list: '/schools',
  detail: (schoolId: number | string) => `/schools/${schoolId}`,
  create: '/schools/create',
  createVehicle: (schoolId: number) => `/schools/${schoolId}/cars/create`,
  addCategory: (schoolId: number) => `/schools/${schoolId}/categories/add`
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
