import { createError } from 'h3'
import { adminSchoolSchema } from '../../validation/admin.ts'
import {
  requireCompatibleMembership,
  school as requireSchool,
  type Transaction
} from './relations.ts'
export async function saveSchool(tx: Transaction, id: number | null, input: unknown) {
  const { categoryIds, managerId, ...data } = adminSchoolSchema.parse(input)
  if (id !== null) await requireSchool(tx, id)
  if (managerId !== null) {
    await requireCompatibleMembership(tx, managerId, 'manager')
    const managed = await tx.drivingSchool.findUnique({ where: { managerId } })
    if (managed && managed.id !== id)
      throw createError({
        statusCode: 409,
        statusMessage: 'This user manages another school. Unassign them there first.'
      })
  }
  if ((await tx.category.count({ where: { id: { in: categoryIds } } })) !== categoryIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'One or more categories no longer exist' })
  }
  if (
    id !== null &&
    (await tx.application.count({
      where: { drivingSchoolId: id, categoryId: { notIn: categoryIds } }
    }))
  ) {
    throw createError({
      statusCode: 409,
      statusMessage:
        'A removed category is used by applications. Update or delete those applications first.'
    })
  }
  const values = { ...data, managerId, categories: { set: categoryIds.map((id) => ({ id })) } }
  const school =
    id === null
      ? await tx.drivingSchool.create({
          data: {
            ...data,
            managerId,
            createdAt: new Date(),
            categories: { connect: categoryIds.map((id) => ({ id })) }
          }
        })
      : await tx.drivingSchool.update({ where: { id }, data: values })
  return { id: school.id }
}
