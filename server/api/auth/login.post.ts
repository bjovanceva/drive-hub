import { AuthService } from '../../services/AuthService'
import { loginUserSchema } from '../../validation/auth'

/** Authenticates both USER and ADMIN accounts through the same endpoint. */
export default defineEventHandler(async (event) => {
  const command = await readValidatedBody(event, loginUserSchema.parse)
  const user = await new AuthService().login(command)

  await setUserSession(event, {
    user,
    loggedInAt: new Date().toISOString()
  })

  return { user }
})
