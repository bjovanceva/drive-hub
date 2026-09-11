import prisma from '../utils/prisma'

/** Database queries for driving-school applications. */
export class ApplicationRepository {
  async hasSchoolMembership(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        drivingSchoolId: true,
        instructorSchoolId: true,
        managedSchool: { select: { id: true } }
      }
    })

    if (!user) return true
    return user.drivingSchoolId !== null || user.instructorSchoolId !== null || user.managedSchool !== null
  }

  async findDuplicate(userId: number, drivingSchoolId: number, categoryId: number) {
    return prisma.application.findUnique({
      where: {
        userId_drivingSchoolId_categoryId: {
          userId,
          drivingSchoolId,
          categoryId
        }
      }
    })
  }

  async categoryBelongsToSchool(drivingSchoolId: number, categoryId: number) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        drivingSchools: { some: { id: drivingSchoolId } }
      },
      select: { id: true }
    })

    return Boolean(category)
  }

  async instructorBelongsToSchool(instructorId: number, drivingSchoolId: number) {
    const instructor = await prisma.user.findFirst({
      where: { id: instructorId, instructorSchoolId: drivingSchoolId },
      select: { id: true }
    })

    return Boolean(instructor)
  }

  async create(userId: number, drivingSchoolId: number, categoryId: number, preferredInstructorId: number | null) {
    return prisma.application.create({
      data: { userId, drivingSchoolId, categoryId, preferredInstructorId },
      select: {
        id: true,
        status: true,
        startedAt: true,
        drivingSchoolId: true,
        categoryId: true,
        preferredInstructorId: true
      }
    })
  }

  async restart(id: number, preferredInstructorId: number | null) {
    return prisma.application.update({
      where: { id },
      data: {
        status: 'PENDING',
        startedAt: new Date(),
        preferredInstructorId
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        drivingSchoolId: true,
        categoryId: true,
        preferredInstructorId: true
      }
    })
  }
}
