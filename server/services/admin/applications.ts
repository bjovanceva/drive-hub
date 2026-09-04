import { createError } from 'h3'
import { adminApplicationSchema } from '../../validation/admin.ts'
import {
  ordinaryUser,
  requireCompatibleMembership,
  school as requireSchool,
  instructor,
  type Transaction
} from './relations.ts'
export async function saveApplication(tx: Transaction, id: number | null, input: unknown) {
  const data = adminApplicationSchema.parse(input)
  const user = await ordinaryUser(tx, data.userId)
  const school = await requireSchool(tx, data.drivingSchoolId)
  if (!school.categories.some((category) => category.id === data.categoryId))
    throw createError({
      statusCode: 400,
      statusMessage: 'This category is not offered by the selected school'
    })
  await instructor(tx, data.preferredInstructorId, data.drivingSchoolId)
  if (data.status === 'APPROVED') {
    await requireCompatibleMembership(tx, user.id, 'student')
    if (user.drivingSchoolId !== null && user.drivingSchoolId !== data.drivingSchoolId) {
      throw createError({
        statusCode: 409,
        statusMessage:
          'This applicant is enrolled at another school. Transfer their student membership in Users first.'
      })
    }
    await tx.user.update({
      where: { id: user.id },
      data: { drivingSchoolId: data.drivingSchoolId }
    })
  }
  const application =
    id === null
      ? await tx.application.create({ data })
      : await tx.application.update({ where: { id }, data })
  return { id: application.id }
}
