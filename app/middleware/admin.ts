import { authRoutes, userRoutes } from '#shared/constants/routes'

/** Protects administrator pages; their APIs independently enforce the role. */
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo({ path: authRoutes.login, query: { redirect: to.fullPath } })
  }

  if (user.value?.role !== 'ADMIN') {
    return navigateTo(userRoutes.startApplication)
  }
})
