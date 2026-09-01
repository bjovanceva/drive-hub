import type { H3Event } from 'h3'
import { AuthService } from '../services/AuthService'

/**
 * Protects ordinary-user APIs with both a valid cookie and a fresh database
 * role check. Future application/progress routes should call this helper.
 */
export async function requireOrdinaryUser(event: H3Event) {
  const session = await requireUserSession(event)
  const user = await new AuthService().getOrdinaryUser(session.user.id)

  return user
}
