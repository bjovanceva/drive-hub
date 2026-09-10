import { createError } from 'h3'
import type { Prisma, PrismaClient } from '../../app/generated/prisma/client.ts'
import prisma from '../utils/prisma.ts'
import {
  addInstructorSchema,
  approveApplicationSchema,
  createManagerVehicleSchema,
  scheduleLessonSchema,
  updateManagerVehicleSchema,
  updateLessonSchema,
  updateTrainingSchema
} from '../validation/manager.ts'
import { readableAdminError } from './admin/errors.ts'
import { MAX_ACTIVE_STUDENTS_PER_INSTRUCTOR } from './admin/applications.ts'

type Transaction = Prisma.TransactionClient

/** Owns all mutations and read models available to a driving-school manager. */
export class ManagerService {
  private database: PrismaClient

  constructor(database: PrismaClient = prisma) {
    this.database = database
  }

  async overview(schoolId: number) {
    const [school, applications, instructors, students, enrollments, lessons, vehicles] = await Promise.all([
      this.database.drivingSchool.findUniqueOrThrow({
        where: { id: schoolId },
        select: { id: true, name: true, city: true, email: true, phone: true }
      }),
      this.database.application.findMany({
        where: { drivingSchoolId: schoolId },
        orderBy: { startedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, code: true, name: true } },
          preferredInstructor: { select: { id: true, name: true } },
          trainingEnrollment: { select: { id: true, instructorId: true } }
        }
      }),
      this.database.user.findMany({
        where: { role: 'USER', instructorSchoolId: schoolId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          vehicle: {
            where: { drivingSchoolId: schoolId },
            orderBy: { registration: 'asc' },
            select: { id: true, registration: true, brand: true, model: true }
          },
          trainingAsInstructor: {
            where: { drivingSchoolId: schoolId, status: { in: ['ACTIVE', 'PAUSED'] } },
            select: { studentId: true }
          }
        }
      }),
      this.database.user.findMany({
        where: { role: 'USER', drivingSchoolId: schoolId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          trainingAsStudent: {
            where: { drivingSchoolId: schoolId },
            orderBy: { startedAt: 'desc' },
            select: {
              id: true,
              status: true,
              category: { select: { id: true, code: true, name: true } },
              instructor: { select: { id: true, name: true } },
              vehicle: { select: { id: true, registration: true, brand: true, model: true } }
            }
          }
        }
      }),
      this.database.trainingEnrollment.findMany({
        where: { drivingSchoolId: schoolId },
        orderBy: { startedAt: 'desc' },
        include: {
          student: { select: { id: true, name: true, email: true } },
          category: {
            select: {
              id: true,
              code: true,
              name: true,
              lessons: {
                orderBy: { sequence: 'asc' },
                select: {
                  id: true,
                  sequence: true,
                  type: true,
                  title: true,
                  durationMinutes: true
                }
              }
            }
          },
          instructor: { select: { id: true, name: true } },
          vehicle: { select: { id: true, registration: true, brand: true, model: true } }
        }
      }),
      this.database.lessonSession.findMany({
        where: { trainingEnrollment: { drivingSchoolId: schoolId } },
        orderBy: { scheduledStart: 'desc' },
        include: {
          trainingEnrollment: {
            select: {
              student: { select: { id: true, name: true, email: true } },
              category: { select: { id: true, code: true, name: true } }
            }
          },
          curriculumLesson: {
            select: { id: true, sequence: true, type: true, title: true, durationMinutes: true }
          },
          instructor: { select: { id: true, name: true } },
          vehicle: { select: { id: true, registration: true, brand: true, model: true } }
        }
      }),
      this.database.vehicle.findMany({
        where: { drivingSchoolId: schoolId },
        orderBy: { registration: 'asc' },
        select: {
          id: true,
          registration: true,
          brand: true,
          model: true,
          year: true,
          instructorId: true
        }
      })
    ])

    const instructorRoster = instructors.map(({ trainingAsInstructor, ...instructor }) => ({
      ...instructor,
        activeStudents: new Set(trainingAsInstructor.map((training) => training.studentId)).size
    }))
    const activeStudentCount = students.filter((student) =>
      student.trainingAsStudent.some((training) => training.status === 'ACTIVE' || training.status === 'PAUSED')
    ).length

    return {
      view: 'MANAGER' as const,
      school,
      summary: {
        pendingApplications: applications.filter((application) => application.status === 'PENDING').length,
        instructors: instructorRoster.length,
        activeStudents: activeStudentCount,
        vehicles: vehicles.length
      },
      applications,
      instructors: instructorRoster,
      students,
      trainings: enrollments,
      lessons: lessons.map((session) => ({
        id: session.id,
        status: session.status,
        scheduledStart: session.scheduledStart,
        scheduledEnd: session.scheduledEnd,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        notes: session.notes,
        student: session.trainingEnrollment.student,
        category: session.trainingEnrollment.category,
        lesson: session.curriculumLesson,
        instructor: session.instructor,
        vehicle: session.vehicle
      })),
      vehicles
    }
  }

  async searchUnassignedUsers(schoolId: number, query: string) {
    const email = query.trim().toLowerCase()
    if (email.length < 2) return []

    return this.database.user.findMany({
      where: {
        role: 'USER',
        drivingSchoolId: null,
        instructorSchoolId: null,
        managedSchool: null,
        email: { contains: email, mode: 'insensitive' },
        NOT: { applications: { some: { status: 'APPROVED' } } }
      },
      orderBy: { email: 'asc' },
      take: 12,
      select: { id: true, name: true, email: true }
    })
  }

  async approveApplication(schoolId: number, applicationId: number, input: unknown) {
    const { instructorId } = approveApplicationSchema.parse(input)
    return this.runTransaction(async (tx) => {
      const application = await tx.application.findFirst({
        where: { id: applicationId, drivingSchoolId: schoolId },
        include: { user: true, trainingEnrollment: true }
      })
      if (!application) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
      if (application.status !== 'PENDING') {
        throw createError({ statusCode: 409, statusMessage: 'Only pending applications can be approved' })
      }
      if (
        application.user.role !== 'USER' ||
        application.user.instructorSchoolId !== null ||
        application.user.drivingSchoolId !== null ||
        await tx.drivingSchool.findUnique({ where: { managerId: application.userId }, select: { id: true } })
      ) {
        throw createError({ statusCode: 409, statusMessage: 'This applicant already has a school role' })
      }
      await this.requireSchoolInstructor(tx, schoolId, instructorId)
      await this.requireInstructorCapacity(tx, instructorId, application.userId)

      const assignedVehicle = await tx.vehicle.findFirst({
        where: { drivingSchoolId: schoolId, instructorId },
        orderBy: { id: 'asc' },
        select: { id: true }
      })
      await tx.user.update({ where: { id: application.userId }, data: { drivingSchoolId: schoolId } })
      await tx.application.update({
        where: { id: applicationId },
        data: { status: 'APPROVED', preferredInstructorId: instructorId }
      })
      const training = await tx.trainingEnrollment.upsert({
        where: { applicationId },
        create: {
          applicationId,
          studentId: application.userId,
          drivingSchoolId: schoolId,
          categoryId: application.categoryId,
          instructorId,
          vehicleId: assignedVehicle?.id ?? null
        },
        update: {
          status: 'ACTIVE',
          completedAt: null,
          instructorId,
          vehicleId: assignedVehicle?.id ?? null
        },
        select: { id: true }
      })
      return { id: applicationId, trainingEnrollmentId: training.id }
    })
  }

  async rejectApplication(schoolId: number, applicationId: number) {
    return this.runTransaction(async (tx) => {
      const application = await tx.application.findFirst({
        where: { id: applicationId, drivingSchoolId: schoolId },
        select: { id: true, status: true }
      })
      if (!application) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
      if (application.status !== 'PENDING') {
        throw createError({ statusCode: 409, statusMessage: 'Only pending applications can be rejected' })
      }
      await tx.application.update({ where: { id: applicationId }, data: { status: 'REJECTED' } })
      return { id: applicationId }
    })
  }

  async addInstructor(schoolId: number, input: unknown) {
    const { userId } = addInstructorSchema.parse(input)
    return this.runTransaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { managedSchool: { select: { id: true } } }
      })
      if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })
      if (
        user.role !== 'USER' ||
        user.drivingSchoolId !== null ||
        user.instructorSchoolId !== null ||
        user.managedSchool !== null
      ) {
        throw createError({ statusCode: 409, statusMessage: 'Only an unassigned user can become an instructor' })
      }
      await tx.user.update({ where: { id: userId }, data: { instructorSchoolId: schoolId } })
      return { id: userId }
    })
  }

  async removeInstructor(schoolId: number, instructorId: number) {
    return this.runTransaction(async (tx) => {
      await this.requireSchoolInstructor(tx, schoolId, instructorId)
      await Promise.all([
        tx.vehicle.updateMany({ where: { drivingSchoolId: schoolId, instructorId }, data: { instructorId: null } }),
        tx.application.updateMany({ where: { drivingSchoolId: schoolId, preferredInstructorId: instructorId }, data: { preferredInstructorId: null } }),
        tx.trainingEnrollment.updateMany({ where: { drivingSchoolId: schoolId, instructorId }, data: { instructorId: null, vehicleId: null } }),
        tx.lessonSession.updateMany({
          where: {
            instructorId,
            status: 'SCHEDULED',
            trainingEnrollment: { drivingSchoolId: schoolId }
          },
          data: { status: 'CANCELLED' }
        })
      ])
      await tx.user.update({ where: { id: instructorId }, data: { instructorSchoolId: null } })
      return { id: instructorId }
    })
  }

  async updateTraining(schoolId: number, trainingId: number, input: unknown) {
    const data = updateTrainingSchema.parse(input)
    return this.runTransaction(async (tx) => {
      const training = await tx.trainingEnrollment.findFirst({
        where: { id: trainingId, drivingSchoolId: schoolId, student: { drivingSchoolId: schoolId } },
        select: { id: true, studentId: true }
      })
      if (!training) throw createError({ statusCode: 404, statusMessage: 'Student training not found' })

      if (data.instructorId !== null) {
        await this.requireSchoolInstructor(tx, schoolId, data.instructorId)
        if (data.status === 'ACTIVE' || data.status === 'PAUSED') {
          await this.requireInstructorCapacity(tx, data.instructorId, training.studentId)
        }
      }

      if (data.vehicleId !== null) {
        const vehicle = await tx.vehicle.findFirst({
          where: { id: data.vehicleId, drivingSchoolId: schoolId },
          select: { id: true, instructorId: true }
        })
        if (!vehicle) throw createError({ statusCode: 400, statusMessage: 'Choose a vehicle from this school' })
        if (vehicle.instructorId !== null && vehicle.instructorId !== data.instructorId) {
          throw createError({ statusCode: 400, statusMessage: 'This vehicle is assigned to another instructor' })
        }
      }

      if (data.status !== 'ACTIVE') {
        await tx.lessonSession.updateMany({
          where: { trainingEnrollmentId: training.id, status: 'SCHEDULED' },
          data: { status: 'CANCELLED' }
        })
      }

      await tx.trainingEnrollment.update({
        where: { id: training.id },
        data: {
          status: data.status,
          completedAt: data.status === 'COMPLETED' ? new Date() : null,
          instructorId: data.instructorId,
          vehicleId: data.vehicleId
        }
      })
      return { id: training.id, status: data.status }
    })
  }

  async removeStudent(schoolId: number, studentId: number) {
    return this.runTransaction(async (tx) => {
      const student = await tx.user.findFirst({
        where: { id: studentId, role: 'USER', drivingSchoolId: schoolId },
        select: { id: true }
      })
      if (!student) throw createError({ statusCode: 404, statusMessage: 'Student not found' })

      await tx.lessonSession.updateMany({
        where: {
          status: 'SCHEDULED',
          trainingEnrollment: { studentId, drivingSchoolId: schoolId }
        },
        data: { status: 'CANCELLED' }
      })
      await tx.trainingEnrollment.updateMany({
        where: { studentId, drivingSchoolId: schoolId, status: { in: ['ACTIVE', 'PAUSED'] } },
        data: { status: 'CANCELLED', completedAt: null, instructorId: null, vehicleId: null }
      })
      await tx.application.updateMany({
        where: { userId: studentId, drivingSchoolId: schoolId, status: 'APPROVED' },
        data: { status: 'CANCELLED' }
      })
      await tx.user.update({ where: { id: studentId }, data: { drivingSchoolId: null } })
      return { id: studentId }
    })
  }

  async createVehicle(schoolId: number, input: unknown) {
    const data = createManagerVehicleSchema.parse(input)
    return this.runTransaction(async (tx) => {
      if (data.instructorId !== null) await this.requireSchoolInstructor(tx, schoolId, data.instructorId)
      return tx.vehicle.create({
        data: {
          drivingSchoolId: schoolId,
          registration: data.registration.toUpperCase(),
          brand: data.brand,
          model: data.model,
          year: data.year,
          instructorId: data.instructorId
        },
        select: { id: true }
      })
    })
  }

  async updateVehicle(schoolId: number, vehicleId: number, input: unknown) {
    const data = updateManagerVehicleSchema.parse(input)
    return this.runTransaction(async (tx) => {
      const vehicle = await tx.vehicle.findFirst({
        where: { id: vehicleId, drivingSchoolId: schoolId },
        select: { id: true, instructorId: true }
      })
      if (!vehicle) throw createError({ statusCode: 404, statusMessage: 'Vehicle not found' })
      if (data.instructorId !== null) await this.requireSchoolInstructor(tx, schoolId, data.instructorId)

      if (data.instructorId !== null && vehicle.instructorId !== data.instructorId) {
        await Promise.all([
          tx.trainingEnrollment.updateMany({
            where: {
              vehicleId,
              OR: [{ instructorId: null }, { instructorId: { not: data.instructorId } }]
            },
            data: { vehicleId: null }
          }),
          tx.lessonSession.updateMany({
            where: {
              vehicleId,
              status: 'SCHEDULED',
              OR: [{ instructorId: null }, { instructorId: { not: data.instructorId } }]
            },
            data: { vehicleId: null }
          })
        ])
      }

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          registration: data.registration.toUpperCase(),
          brand: data.brand,
          model: data.model,
          year: data.year,
          instructorId: data.instructorId
        }
      })
      return { id: vehicleId }
    })
  }

  async removeVehicle(schoolId: number, vehicleId: number) {
    return this.runTransaction(async (tx) => {
      const vehicle = await tx.vehicle.findFirst({
        where: { id: vehicleId, drivingSchoolId: schoolId },
        select: { id: true }
      })
      if (!vehicle) throw createError({ statusCode: 404, statusMessage: 'Vehicle not found' })

      await Promise.all([
        tx.trainingEnrollment.updateMany({ where: { vehicleId }, data: { vehicleId: null } }),
        tx.lessonSession.updateMany({ where: { vehicleId }, data: { vehicleId: null } })
      ])
      await tx.vehicle.delete({ where: { id: vehicleId } })
      return { id: vehicleId }
    })
  }

  async scheduleLesson(schoolId: number, input: unknown) {
    const data = scheduleLessonSchema.parse(input)
    return this.runTransaction(async (tx) => {
      const training = await tx.trainingEnrollment.findFirst({
        where: { id: data.trainingEnrollmentId, drivingSchoolId: schoolId },
        select: { id: true, studentId: true, categoryId: true, status: true }
      })
      if (!training) throw createError({ statusCode: 404, statusMessage: 'Student training not found' })
      if (training.status !== 'ACTIVE') {
        throw createError({ statusCode: 409, statusMessage: 'Lessons can only be scheduled for active training' })
      }
      const lesson = await tx.curriculumLesson.findFirst({
        where: { id: data.curriculumLessonId, categoryId: training.categoryId }
      })
      if (!lesson) throw createError({ statusCode: 400, statusMessage: 'Choose a lesson from the student curriculum' })
      if (lesson.type === 'PRACTICAL' && data.instructorId === null) {
        throw createError({ statusCode: 400, statusMessage: 'Practical lessons require an instructor' })
      }
      if (data.instructorId !== null) await this.requireSchoolInstructor(tx, schoolId, data.instructorId)

      const scheduledStart = new Date(data.scheduledStart)
      const scheduledEnd = new Date(scheduledStart.getTime() + lesson.durationMinutes * 60_000)
      if (scheduledStart.getTime() < Date.now()) {
        throw createError({ statusCode: 400, statusMessage: 'Choose a future lesson time' })
      }
      if (data.vehicleId !== null) {
        const vehicle = await tx.vehicle.findFirst({
          where: { id: data.vehicleId, drivingSchoolId: schoolId },
          select: { id: true, instructorId: true }
        })
        if (!vehicle) throw createError({ statusCode: 400, statusMessage: 'Choose a vehicle from this school' })
        if (vehicle.instructorId !== null && vehicle.instructorId !== data.instructorId) {
          throw createError({ statusCode: 400, statusMessage: 'This vehicle is assigned to another instructor' })
        }
      }
      const conflict = await tx.lessonSession.findFirst({
        where: {
          status: 'SCHEDULED',
          scheduledStart: { lt: scheduledEnd },
          scheduledEnd: { gt: scheduledStart },
          OR: [
            { trainingEnrollment: { studentId: training.studentId } },
            ...(data.instructorId === null ? [] : [{ instructorId: data.instructorId }]),
            ...(data.vehicleId === null ? [] : [{ vehicleId: data.vehicleId }])
          ]
        },
        select: { id: true }
      })
      if (conflict) throw createError({ statusCode: 409, statusMessage: 'The student, instructor or vehicle is already booked at that time' })
      const session = await tx.lessonSession.create({
        data: {
          trainingEnrollmentId: training.id,
          curriculumLessonId: lesson.id,
          scheduledStart,
          scheduledEnd,
          instructorId: data.instructorId,
          vehicleId: data.vehicleId,
          notes: data.notes || null
        },
        select: { id: true }
      })
      return session
    })
  }

  async updateLesson(schoolId: number, lessonSessionId: number, input: unknown) {
    const data = updateLessonSchema.parse(input)
    return this.runTransaction(async (tx) => {
      const session = await tx.lessonSession.findFirst({
        where: { id: lessonSessionId, trainingEnrollment: { drivingSchoolId: schoolId } },
        include: {
          curriculumLesson: true,
          trainingEnrollment: { select: { studentId: true } }
        }
      })
      if (!session) throw createError({ statusCode: 404, statusMessage: 'Lesson not found' })
      if (session.status !== 'SCHEDULED') {
        throw createError({ statusCode: 409, statusMessage: 'Only scheduled lessons can be changed' })
      }

      if (data.action === 'complete') {
        const completedAt = new Date()
        if (session.scheduledStart.getTime() > completedAt.getTime()) {
          throw createError({ statusCode: 409, statusMessage: 'A lesson cannot be completed before its scheduled start' })
        }
        await tx.lessonSession.update({
          where: { id: session.id },
          data: {
            status: 'COMPLETED',
            startedAt: session.startedAt ?? session.scheduledStart,
            completedAt
          }
        })
        return { id: session.id, status: 'COMPLETED' as const }
      }

      if (data.action === 'cancel') {
        await tx.lessonSession.update({
          where: { id: session.id },
          data: { status: 'CANCELLED' }
        })
        return { id: session.id, status: 'CANCELLED' as const }
      }

      if (session.curriculumLesson.type === 'PRACTICAL' && data.instructorId === null) {
        throw createError({ statusCode: 400, statusMessage: 'Practical lessons require an instructor' })
      }
      if (data.instructorId !== null) {
        await this.requireSchoolInstructor(tx, schoolId, data.instructorId)
      }
      if (data.vehicleId !== null) {
        const vehicle = await tx.vehicle.findFirst({
          where: { id: data.vehicleId, drivingSchoolId: schoolId },
          select: { id: true, instructorId: true }
        })
        if (!vehicle) throw createError({ statusCode: 400, statusMessage: 'Choose a vehicle from this school' })
        if (vehicle.instructorId !== null && vehicle.instructorId !== data.instructorId) {
          throw createError({ statusCode: 400, statusMessage: 'This vehicle is assigned to another instructor' })
        }
      }

      const scheduledStart = new Date(data.scheduledStart)
      if (scheduledStart.getTime() < Date.now()) {
        throw createError({ statusCode: 400, statusMessage: 'Choose a future lesson time' })
      }
      const scheduledEnd = new Date(
        scheduledStart.getTime() + session.curriculumLesson.durationMinutes * 60_000
      )
      const conflict = await tx.lessonSession.findFirst({
        where: {
          id: { not: session.id },
          status: 'SCHEDULED',
          scheduledStart: { lt: scheduledEnd },
          scheduledEnd: { gt: scheduledStart },
          OR: [
            { trainingEnrollment: { studentId: session.trainingEnrollment.studentId } },
            ...(data.instructorId === null ? [] : [{ instructorId: data.instructorId }]),
            ...(data.vehicleId === null ? [] : [{ vehicleId: data.vehicleId }])
          ]
        },
        select: { id: true }
      })
      if (conflict) {
        throw createError({ statusCode: 409, statusMessage: 'The student, instructor or vehicle is already booked at that time' })
      }
      await tx.lessonSession.update({
        where: { id: session.id },
        data: {
          scheduledStart,
          scheduledEnd,
          instructorId: data.instructorId,
          vehicleId: data.vehicleId,
          startedAt: null,
          completedAt: null
        }
      })
      return { id: session.id, status: 'SCHEDULED' as const }
    })
  }

  private async requireSchoolInstructor(tx: Transaction, schoolId: number, instructorId: number) {
    const instructor = await tx.user.findFirst({
      where: { id: instructorId, role: 'USER', instructorSchoolId: schoolId },
      select: { id: true }
    })
    if (!instructor) throw createError({ statusCode: 400, statusMessage: 'Choose an instructor from your school' })
    return instructor
  }

  private async requireInstructorCapacity(tx: Transaction, instructorId: number, studentId: number) {
    const activeStudents = await tx.trainingEnrollment.findMany({
      where: { instructorId, status: { in: ['ACTIVE', 'PAUSED'] } },
      distinct: ['studentId'],
      select: { studentId: true }
    })
    if (!activeStudents.some((training) => training.studentId === studentId) && activeStudents.length >= MAX_ACTIVE_STUDENTS_PER_INSTRUCTOR) {
      throw createError({ statusCode: 409, statusMessage: `This instructor already has the maximum of ${MAX_ACTIVE_STUDENTS_PER_INSTRUCTOR} active students` })
    }
  }

  private async runTransaction<T>(operation: (tx: Transaction) => Promise<T>) {
    try {
      return await this.database.$transaction(operation, {
        isolationLevel: 'Serializable',
        timeout: 15_000
      })
    } catch (error) {
      throw readableAdminError(error)
    }
  }
}
