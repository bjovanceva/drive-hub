import { AuthService } from '../../services/AuthService'
import { requireOrdinaryUser } from '../../utils/authorization'
import { updateProfileSchema } from '../../validation/auth'

export default defineEventHandler(async (event) => {
  const currentUser = await requireOrdinaryUser(event)
  const command = await readValidatedBody(event, updateProfileSchema.parse)
  const user = await new AuthService().updateProfile(currentUser.id, command)
  const session = await getUserSession(event)
  await setUserSession(event, { ...session, user })
  return { user }
})
