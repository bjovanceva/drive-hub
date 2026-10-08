import { AuthService } from '../../services/AuthService'
import { loginUserSchema } from '../../validation/auth'
import { readAuthBody } from '../../utils/authValidation'

/** Authenticates both USER and ADMIN accounts through the same endpoint. */
export default defineEventHandler(async (event) => {
  const command = await readAuthBody(event, loginUserSchema)
  const user = await new AuthService().login(command)

  await setUserSession(event, {
    user,
    loggedInAt: new Date().toISOString()
  })

  return { user }
})
