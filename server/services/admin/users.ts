import { createError } from 'h3'
import { adminUserSchema } from '../../validation/admin.ts'
import { ordinaryUser, school as requireSchool, identity, type Transaction } from './relations.ts'
export async function saveUser(
  tx: Transaction,
  id: number | null,
  input: unknown,
  hashPassword: (password: string) => Promise<string>
) {
  const data = adminUserSchema.parse(input)
  const existing = id === null ? null : await ordinaryUser(tx, id)
  if (id === null && !data.password)
    throw createError({ statusCode: 400, statusMessage: 'A password is required for a new user' })
  for (const schoolId of [data.studentSchoolId, data.instructorSchoolId, data.managedSchoolId]) {
    if (schoolId !== null) await requireSchool(tx, schoolId)
  }
  if (data.managedSchoolId !== null) {
    const target = await requireSchool(tx, data.managedSchoolId)
    if (target.managerId !== null && target.managerId !== id)
      throw createError({
        statusCode: 409,
        statusMessage: 'That school already has a manager. Change the manager in the school editor.'
      })
  }
  const password = data.password ? await hashPassword(data.password) : undefined
  const values = {
    name: data.name,
    email: data.email,
    drivingSchoolId: data.studentSchoolId,
    instructorSchoolId: data.instructorSchoolId
  }
  if (id !== null)
    await tx.drivingSchool.updateMany({ where: { managerId: id }, data: { managerId: null } })
  const user =
    id === null
      ? await tx.user.create({
          data: { ...values, role: 'USER', password: password! },
          select: identity
        })
      : await tx.user.update({
          where: { id, role: 'USER' },
          data: { ...values, ...(password ? { password } : {}) },
          select: identity
        })

  if (existing && existing.instructorSchoolId !== data.instructorSchoolId) {
    // Instructor preferences and vehicle assignments cannot point across schools.
    await tx.vehicle.updateMany({ where: { instructorId: user.id }, data: { instructorId: null } })
    await tx.application.updateMany({
      where: { preferredInstructorId: user.id },
      data: { preferredInstructorId: null }
    })
    await tx.trainingEnrollment.updateMany({
      where: { instructorId: user.id },
      data: { instructorId: null, vehicleId: null }
    })
  }
  if (data.managedSchoolId !== null)
    await tx.drivingSchool.update({
      where: { id: data.managedSchoolId },
      data: { managerId: user.id }
    })
  return { id: user.id }
}
