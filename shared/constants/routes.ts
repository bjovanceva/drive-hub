/** Shared authentication routes for Drive Hub users and administrators. */
export const authRoutes = {
  login: '/login',
  register: '/register'
} as const

/** Directory and school-management routes. */
export const schoolRoutes = {
  list: '/schools',
  detail: (schoolId: number | string) => `/schools/${schoolId}`
} as const

/** Routes that require an authenticated USER session. */
export const userRoutes = {
  dashboard: '/dashboard',
  profile: '/profile',
  startApplication: '/start-application'
} as const

/** Routes that require an authenticated ADMIN session. */
export const adminRoutes = {
  dashboard: '/administration'
} as const
