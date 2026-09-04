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

  async login(command: LoginUserCommand) {
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

    if (passwordNeedsReHash(user.password)) {
      await this.users.updatePassword(user.id, await hashPassword(command.password))
    }

    return this.toSessionUser(user)
  }

  async getAuthenticatedUser(id: number) {
    const user = await this.users.findForSession(id)

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }

    return this.toSessionUser(user)
  }

  async getOrdinaryUser(id: number) {
    const user = await this.getAuthenticatedUser(id)

    if (user.role !== 'USER') {
      throw createError({ statusCode: 403, statusMessage: 'Ordinary user access required' })
    }

    return user
  }

  async updateProfile(id: number, command: { name: string, email: string, currentPassword?: string }) {
    const user = await this.getOrdinaryUserForSettings(id)
    const email = command.email.trim().toLowerCase()

    if (email !== user.email) {
      await this.checkCurrentPassword(user.password, command.currentPassword)
    }

    try {
      return this.toSessionUser(await this.users.updateOrdinaryUser(id, {
        name: command.name.trim(),
        email
      }))
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })
      }
      throw error
    }
  }

  async changePassword(id: number, command: { currentPassword: string, newPassword: string }) {
    const user = await this.getOrdinaryUserForSettings(id)
    await this.checkCurrentPassword(user.password, command.currentPassword)

    if (command.currentPassword === command.newPassword) {
      throw createError({ statusCode: 400, statusMessage: 'Choose a different new password' })
    }

    return this.toSessionUser(await this.users.updateOrdinaryUser(id, {
      password: await hashPassword(command.newPassword)
    }))
  }

  private async getOrdinaryUserForSettings(id: number) {
    const user = await this.users.findForSession(id)
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    if (user.role !== 'USER') {
      throw createError({ statusCode: 403, statusMessage: 'Ordinary user access required' })
    }
    return user
  }

  private async checkCurrentPassword(storedHash: string, password?: string) {
    if (!password || !await verifyPassword(storedHash, password)) {
      throw createError({ statusCode: 400, statusMessage: 'Current password is incorrect' })
    }
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
