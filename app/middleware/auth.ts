import { authRoutes } from '#shared/constants/routes'

/** Allows only authenticated ordinary users to enter public-app user routes. */
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo({
      path: authRoutes.login,
      query: { redirect: to.fullPath }
    })
  }

  if (user.value?.role !== 'USER') {
    return navigateTo('/')
  }
})
