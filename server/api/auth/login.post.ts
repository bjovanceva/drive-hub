import { AuthService } from '../../services/AuthService'
import { loginUserSchema } from '../../validation/auth'

/** Authenticates ordinary users; ADMIN accounts are intentionally rejected. */
export default defineEventHandler(async (event) => {
  const command = await readValidatedBody(event, loginUserSchema.parse)
  const user = await new AuthService().loginOrdinaryUser(command)

  await setUserSession(event, {
    user,
    loggedInAt: new Date().toISOString()
  })

  return { user }
})
