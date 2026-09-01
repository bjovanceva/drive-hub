import { userRoutes } from '#shared/constants/routes'

/** Keeps signed-in ordinary users out of the login and registration pages. */
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()

  if (loggedIn.value && user.value?.role === 'USER') {
    return navigateTo(userRoutes.startApplication)
  }
})
