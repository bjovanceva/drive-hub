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

/** Requires the authenticated user to manage the requested driving school. */
export async function requireSchoolManager(event: H3Event, schoolId: number) {
  const user = await requireOrdinaryUser(event)

  if (user.managedSchoolId !== schoolId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You can only manage your own driving school'
    })
  }

  return user
}

/** Requires an administrator role checked against the current database record. */
export async function requireAdmin(event: H3Event) {
  const session = await requireUserSession(event)
  const user = await new AuthService().getAuthenticatedUser(session.user.id)

  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Administrator access required' })
  }

  return user
}

/** Returns the current user of either role when a valid session is present. */
export async function getAuthenticatedUser(event: H3Event) {
  const session = await getUserSession(event)

  if (!session.user?.id) return null

  return new AuthService().getAuthenticatedUser(session.user.id)
}

/** Restricts school reads for managers while keeping the public directory open. */
export async function restrictManagerToSchool(event: H3Event, schoolId: number) {
  const user = await getAuthenticatedUser(event)

  if (!user) return null

  if (user.role === 'USER' && user.managedSchoolId !== null && user.managedSchoolId !== schoolId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Managers can only view their own driving school'
    })
  }

  return user
}
