import prisma from '../utils/prisma'

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  password: true,
  role: true,
  drivingSchoolId: true,
  instructorSchoolId: true,
  managedSchool: {
    select: { id: true }
  }
} as const

/** Contains the user queries needed by authentication and authorization. */
export class UserRepository {
  async findForAuthentication(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: authUserSelect
    })
  }

  async findForSession(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: authUserSelect
    })
  }

  async findAllForSelection() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managedSchool: {
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    })
  }

  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managedSchool: {
          select: { id: true }
        }
      }
    })
  }

  async findInstructorsBySchoolId(schoolId: number) {
    return prisma.user.findMany({
      where: { instructorSchoolId: schoolId },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' }
    })
  }

  async createOrdinaryUser(data: { name: string, email: string, password: string }) {
    return prisma.user.create({
      data: {
        ...data,
        role: 'USER'
      },
      select: authUserSelect
    })
  }

  async updatePassword(id: number, password: string) {
    return prisma.user.update({
      where: { id },
      data: { password },
      select: { id: true }
    })
  }
}
