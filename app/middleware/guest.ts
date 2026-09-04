import { adminRoutes, userRoutes } from '#shared/constants/routes'

/** Sends signed-in users to the landing page for their role. */
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()

  if (loggedIn.value) {
    return navigateTo(user.value?.role === 'ADMIN' ? adminRoutes.dashboard : userRoutes.startApplication)
  }
})
