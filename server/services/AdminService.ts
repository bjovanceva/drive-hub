import { createError } from 'h3'
import prisma from '../utils/prisma.ts'
import type { PrismaClient } from '../../app/generated/prisma/client.ts'
import { adminMembershipSchema } from '../validation/admin.ts'
import { identity, requireCompatibleMembership, school } from './admin/relations.ts'
import { saveUser } from './admin/users.ts'
import { saveSchool } from './admin/schools.ts'
import { saveApplication } from './admin/applications.ts'
import { saveVehicle } from './admin/vehicles.ts'
import { deleteAdminRecord } from './admin/deletion.ts'
import { readableAdminError } from './admin/errors.ts'

/** Coordinates atomic admin operations; resource rules live in services/admin. */
export class AdminService {
  private database: PrismaClient
  private hash: (password: string) => Promise<string>
  constructor(
    database: PrismaClient = prisma,
    hash: (password: string) => Promise<string> = (password) => hashPassword(password)
  ) {
    this.database = database
    this.hash = hash
  }
  async overview() {
    const [users, schools, applications, vehicles, categories] = await Promise.all([
      this.database.user.findMany({ select: identity, orderBy: { name: 'asc' } }),
      this.database.drivingSchool.findMany({
        include: { categories: { select: { id: true } } },
        orderBy: { name: 'asc' }
      }),
      this.database.application.findMany({ orderBy: { startedAt: 'desc' } }),
      this.database.vehicle.findMany({ orderBy: { registration: 'asc' } }),
      this.database.category.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' }
      })
    ])
    return { users, schools, applications, vehicles, categories }
  }

  async save(resource: string, id: number | null, input: unknown) {
    try {
      return await this.database.$transaction(
        async (tx) => {
          switch (resource) {
            case 'users':
              return saveUser(tx, id, input, this.hash)
            case 'schools':
              return saveSchool(tx, id, input)
            case 'applications':
              return saveApplication(tx, id, input)
            case 'vehicles':
              return saveVehicle(tx, id, input)
            default:
              throw createError({ statusCode: 404, statusMessage: 'Unknown resource' })
          }
        },
        { isolationLevel: 'Serializable', timeout: 15000 }
      )
    } catch (error) {
      throw readableAdminError(error)
    }
  }

  async assignMembership(id: number, input: unknown) {
    try {
      const { kind, schoolId } = adminMembershipSchema.parse(input)
      return await this.database.$transaction(
        async (tx) => {
          const user = await requireCompatibleMembership(tx, id, kind)
          await school(tx, schoolId)
          if (kind === 'instructor' && user.instructorSchoolId !== schoolId) {
            await tx.vehicle.updateMany({
              where: { instructorId: id },
              data: { instructorId: null }
            })
            await tx.application.updateMany({
              where: { preferredInstructorId: id },
              data: { preferredInstructorId: null }
            })
            await tx.trainingEnrollment.updateMany({
              where: { instructorId: id },
              data: { instructorId: null, vehicleId: null }
            })
          }
          await tx.user.update({
            where: { id, role: 'USER' },
            data:
              kind === 'student' ? { drivingSchoolId: schoolId } : { instructorSchoolId: schoolId }
          })
          return { id }
        },
        { isolationLevel: 'Serializable', timeout: 15000 }
      )
    } catch (error) {
      throw readableAdminError(error)
    }
  }

  async remove(resource: string, id: number) {
    try {
      await this.database.$transaction((tx) => deleteAdminRecord(tx, resource, id), {
        isolationLevel: 'Serializable',
        timeout: 15000
      })
      return { success: true }
    } catch (error) {
      throw readableAdminError(error)
    }
  }
}
