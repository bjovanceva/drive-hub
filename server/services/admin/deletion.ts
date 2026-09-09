import { createError } from 'h3'
import { ordinaryUser, school, type Transaction } from './relations.ts'
export async function deleteAdminRecord(tx: Transaction, resource: string, id: number) {
  if (resource === 'users') {
    await ordinaryUser(tx, id)
    await tx.application.deleteMany({ where: { userId: id } })
    await tx.application.updateMany({
      where: { preferredInstructorId: id },
      data: { preferredInstructorId: null }
    })
    await tx.trainingEnrollment.updateMany({
      where: { instructorId: id },
      data: { instructorId: null, vehicleId: null }
    })
    await tx.vehicle.updateMany({ where: { instructorId: id }, data: { instructorId: null } })
    await tx.drivingSchool.updateMany({ where: { managerId: id }, data: { managerId: null } })
    await tx.user.delete({ where: { id, role: 'USER' } })
  } else if (resource === 'schools') {
    await school(tx, id)
    const instructors = await tx.user.findMany({
      where: { instructorSchoolId: id },
      select: { id: true }
    })
    await tx.application.updateMany({
      where: { preferredInstructorId: { in: instructors.map((user) => user.id) } },
      data: { preferredInstructorId: null }
    })
    await tx.trainingEnrollment.updateMany({
      where: { instructorId: { in: instructors.map((user) => user.id) } },
      data: { instructorId: null, vehicleId: null }
    })
    await tx.vehicle.updateMany({
      where: { instructorId: { in: instructors.map((user) => user.id) } },
      data: { instructorId: null }
    })
    await tx.application.deleteMany({ where: { drivingSchoolId: id } })
    await tx.vehicle.deleteMany({ where: { drivingSchoolId: id } })
    await tx.user.updateMany({ where: { drivingSchoolId: id }, data: { drivingSchoolId: null } })
    await tx.user.updateMany({
      where: { instructorSchoolId: id },
      data: { instructorSchoolId: null }
    })
    await tx.drivingSchool.delete({ where: { id } })
  } else if (resource === 'applications') {
    await tx.application.delete({ where: { id } })
  } else if (resource === 'vehicles') {
    await tx.vehicle.delete({ where: { id } })
  } else throw createError({ statusCode: 404, statusMessage: 'Unknown resource' })
}
