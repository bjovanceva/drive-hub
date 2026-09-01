import { AuthService } from '../../services/AuthService'
import { registerUserSchema } from '../../validation/auth'

/** Registers an ordinary USER and starts their sealed cookie session. */
export default defineEventHandler(async (event) => {
  const command = await readValidatedBody(event, registerUserSchema.parse)
  const user = await new AuthService().registerOrdinaryUser(command)

  await setUserSession(event, {
    user,
    loggedInAt: new Date().toISOString()
  })

  setResponseStatus(event, 201)
  return { user }
})
