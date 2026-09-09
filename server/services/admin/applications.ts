import { createError } from 'h3'
import { adminApplicationSchema } from '../../validation/admin.ts'
import {
  ordinaryUser,
  requireCompatibleMembership,
  school as requireSchool,
  instructor,
  type Transaction
} from './relations.ts'

export const MAX_ACTIVE_STUDENTS_PER_INSTRUCTOR = 3
const CAPACITY_STATUSES = ['ACTIVE', 'PAUSED'] as const

async function hasStudentCapacity(
  tx: Transaction,
  instructorId: number,
  studentId: number,
  exceptEnrollmentId?: number
) {
  const activeStudents = await tx.trainingEnrollment.findMany({
    where: {
      instructorId,
      status: { in: [...CAPACITY_STATUSES] },
      ...(exceptEnrollmentId ? { id: { not: exceptEnrollmentId } } : {})
    },
    select: { studentId: true },
    distinct: ['studentId']
  })
  return (
    activeStudents.some((enrollment) => enrollment.studentId === studentId) ||
    activeStudents.length < MAX_ACTIVE_STUDENTS_PER_INSTRUCTOR
  )
}

async function chooseInstructor(
  tx: Transaction,
  schoolId: number,
  studentId: number,
  preferredInstructorId: number | null,
  currentEnrollment: { id: number; instructorId: number | null } | null
) {
  let requestedInstructorId = preferredInstructorId
  if (requestedInstructorId === null && currentEnrollment?.instructorId) {
    const currentInstructor = await tx.user.findFirst({
      where: { id: currentEnrollment.instructorId, instructorSchoolId: schoolId, role: 'USER' },
      select: { id: true }
    })
    requestedInstructorId = currentInstructor?.id ?? null
  }

  if (requestedInstructorId !== null) {
    if (
      !(await hasStudentCapacity(
        tx,
        requestedInstructorId,
        studentId,
        currentEnrollment?.id
      ))
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: 'The selected instructor already has the maximum of 3 active students'
      })
    }
    return requestedInstructorId
  }

  const instructors = await tx.user.findMany({
    where: { instructorSchoolId: schoolId, role: 'USER' },
    select: { id: true }
  })
  const eligible: number[] = []
  for (const instructor of instructors) {
    if (await hasStudentCapacity(tx, instructor.id, studentId, currentEnrollment?.id)) {
      eligible.push(instructor.id)
    }
  }
  if (eligible.length === 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'No instructor at this school currently has room for another student'
    })
  }
  return eligible[Math.floor(Math.random() * eligible.length)]!
}

export async function saveApplication(tx: Transaction, id: number | null, input: unknown) {
  const data = adminApplicationSchema.parse(input)
  const existing =
    id === null
      ? null
      : await tx.application.findUnique({
          where: { id },
          include: {
            trainingEnrollment: { select: { id: true, instructorId: true, vehicleId: true } }
          }
        })
  if (id !== null && existing === null)
    throw createError({ statusCode: 404, statusMessage: 'Application no longer exists' })

  const user = await ordinaryUser(tx, data.userId)
  const school = await requireSchool(tx, data.drivingSchoolId)
  if (!school.categories.some((category) => category.id === data.categoryId))
    throw createError({
      statusCode: 400,
      statusMessage: 'This category is not offered by the selected school'
    })
  await instructor(tx, data.preferredInstructorId, data.drivingSchoolId)
  let training:
    | {
        instructorId: number
        vehicleId: number | null
      }
    | undefined
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

    const assignedInstructorId = await chooseInstructor(
      tx,
      data.drivingSchoolId,
      data.userId,
      data.preferredInstructorId,
      existing?.trainingEnrollment ?? null
    )
    const currentVehicleId =
      existing?.trainingEnrollment?.instructorId === assignedInstructorId
        ? existing.trainingEnrollment.vehicleId
        : null
    const assignedVehicle = currentVehicleId
      ? await tx.vehicle.findFirst({
          where: {
            id: currentVehicleId,
            drivingSchoolId: data.drivingSchoolId,
            instructorId: assignedInstructorId
          },
          select: { id: true }
        })
      : await tx.vehicle.findFirst({
          where: {
            drivingSchoolId: data.drivingSchoolId,
            instructorId: assignedInstructorId
          },
          orderBy: { id: 'asc' },
          select: { id: true }
        })
    training = { instructorId: assignedInstructorId, vehicleId: assignedVehicle?.id ?? null }
  }
  const application =
    id === null
      ? await tx.application.create({ data })
      : await tx.application.update({ where: { id }, data })

  if (training) {
    await tx.trainingEnrollment.upsert({
      where: { applicationId: application.id },
      create: {
        applicationId: application.id,
        studentId: data.userId,
        drivingSchoolId: data.drivingSchoolId,
        categoryId: data.categoryId,
        instructorId: training.instructorId,
        vehicleId: training.vehicleId
      },
      update: {
        status: 'ACTIVE',
        completedAt: null,
        studentId: data.userId,
        drivingSchoolId: data.drivingSchoolId,
        categoryId: data.categoryId,
        instructorId: training.instructorId,
        vehicleId: training.vehicleId
      }
    })
  } else if (
    existing?.trainingEnrollment &&
    (data.status === 'CANCELLED' || data.status === 'REJECTED')
  ) {
    await tx.trainingEnrollment.update({
      where: { id: existing.trainingEnrollment.id },
      data: { status: 'CANCELLED' }
    })
  }
  return { id: application.id }
}
