import prisma from '../utils/prisma'

/** Database queries for driving-school applications. */
export class ApplicationRepository {
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
}