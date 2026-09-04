import { createError } from 'h3'
import type { Prisma } from '../../../app/generated/prisma/client.ts'
export type Transaction = Prisma.TransactionClient
export const identity = {
  id: true,
  name: true,
  email: true,
  role: true,
  drivingSchoolId: true,
  instructorSchoolId: true,
  managedSchool: { select: { id: true } }
} as const
export async function ordinaryUser(tx: Transaction, id: number) {
  const user = await tx.user.findUnique({ where: { id } })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User no longer exists' })
  if (user.role !== 'USER')
    throw createError({
      statusCode: 403,
      statusMessage: 'Administrator accounts are managed through the CLI'
    })
  return user
}

export async function school(tx: Transaction, id: number) {
  const school = await tx.drivingSchool.findUnique({
    where: { id },
    include: { categories: { select: { id: true } } }
  })
  if (!school) throw createError({ statusCode: 404, statusMessage: 'School no longer exists' })
  return school
}

export async function instructor(tx: Transaction, id: number | null, schoolId: number) {
  if (id === null) return
  const user = await ordinaryUser(tx, id)
  if (user.instructorSchoolId !== schoolId)
    throw createError({
      statusCode: 400,
      statusMessage: 'Choose an instructor assigned to this school'
    })
}

/** Assignment shortcuts must not silently replace a different school role. */
export async function requireCompatibleMembership(
  tx: Transaction,
  userId: number,
  kind: 'student' | 'instructor' | 'manager'
) {
  const user = await ordinaryUser(tx, userId)
  const managedSchool = await tx.drivingSchool.findUnique({
    where: { managerId: userId },
    select: { id: true }
  })
  const conflicts =
    (kind !== 'student' && user.drivingSchoolId !== null) ||
    (kind !== 'instructor' && user.instructorSchoolId !== null) ||
    (kind !== 'manager' && managedSchool !== null)
  if (conflicts)
    throw createError({
      statusCode: 409,
      statusMessage: 'A user can only have one school role. Change their role in Users first.'
    })
  return user
}
