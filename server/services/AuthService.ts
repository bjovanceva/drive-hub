import { UserRepository } from '../repositories/UserRepository'

export interface RegisterUserCommand {
  name: string
  email: string
  password: string
}

export interface LoginUserCommand {
  email: string
  password: string
}

type PersistedAuthUser = NonNullable<Awaited<ReturnType<UserRepository['findForSession']>>>

let fallbackPasswordHash: Promise<string> | undefined

/**
 * Owns credential verification and the conversion from database users to the
 * intentionally small identity stored in the sealed session cookie.
 */
export class AuthService {
  private users = new UserRepository()

  async registerOrdinaryUser(command: RegisterUserCommand) {
    const email = command.email.trim().toLowerCase()

    if (await this.users.findForAuthentication(email)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'An account with this email already exists'
      })
    }

    const password = await hashPassword(command.password)

    try {
      const user = await this.users.createOrdinaryUser({
        name: command.name.trim(),
        email,
        password
      })

      return this.toSessionUser(user)
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw createError({
          statusCode: 409,
          statusMessage: 'An account with this email already exists'
        })
      }

      throw error
    }
  }

  async loginOrdinaryUser(command: LoginUserCommand) {
    const email = command.email.trim().toLowerCase()
    const user = await this.users.findForAuthentication(email)
    const storedHash = user?.password ?? await this.getFallbackPasswordHash()
    const validPassword = await verifyPassword(storedHash, command.password)

    if (!user || !validPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    if (user.role !== 'USER') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Administrator accounts must use the admin panel'
      })
    }

    if (passwordNeedsReHash(user.password)) {
      await this.users.updatePassword(user.id, await hashPassword(command.password))
    }

    return this.toSessionUser(user)
  }

  async getOrdinaryUser(id: number) {
    const user = await this.users.findForSession(id)

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }

    if (user.role !== 'USER') {
      throw createError({ statusCode: 403, statusMessage: 'Ordinary user access required' })
    }

    return this.toSessionUser(user)
  }

  private toSessionUser(user: PersistedAuthUser) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentSchoolId: user.drivingSchoolId,
      instructorSchoolId: user.instructorSchoolId,
      managedSchoolId: user.managedSchool?.id ?? null
    }
  }

  /** Performs the same expensive hash check when an email does not exist. */
  private getFallbackPasswordHash() {
    fallbackPasswordHash ??= hashPassword('drive-hub-invalid-password')
    return fallbackPasswordHash
  }

  private isUniqueConstraintError(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
  }
}
