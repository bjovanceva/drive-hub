import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client.ts'
import { ManagerService } from '../server/services/ManagerService.ts'

test(
  'manager admissions, instructor roster and scheduling use real database constraints',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const schema = `manager_test_${randomUUID().replaceAll('-', '')}`
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
    let database
    let createdSchema = false
    try {
      await client.connect()
      await client.query(`CREATE SCHEMA "${schema}"`)
      createdSchema = true
      await client.query(`SET search_path TO "${schema}"`)
      const migrations = new URL('../prisma/migrations/', import.meta.url)
      for (const directory of readdirSync(migrations).filter((name) => /^\d/.test(name)).sort()) {
        const sql = readFileSync(new URL(`${directory}/migration.sql`, migrations), 'utf8')
          .replaceAll('"public".', `"${schema}".`)
        await client.query(sql)
      }
      database = new PrismaClient({
        adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }, { schema })
      })
      const category = await database.category.create({
        data: {
          code: 'B', name: 'Passenger car', price: 30000,
          theoryLessons: 1, practicalLessons: 1, minimumAge: 18
        }
      })
      const [theory, practical] = await Promise.all([
        database.curriculumLesson.create({
          data: { categoryId: category.id, sequence: 1, type: 'THEORY', title: 'Road signs', concept: 'Signs', goal: 'Read signs', durationMinutes: 45 }
        }),
        database.curriculumLesson.create({
          data: { categoryId: category.id, sequence: 2, type: 'PRACTICAL', title: 'Vehicle controls', concept: 'Controls', goal: 'Control vehicle', durationMinutes: 60 }
        })
      ])
      const user = (name, email, relations = {}) => database.user.create({
        data: { name, email, password: 'fixture', role: 'USER', ...relations }
      })
      const manager = await user('Manager', 'manager@manager.invalid')
      const instructor = await user('Instructor', 'instructor@manager.invalid')
      const applicant = await user('Applicant', 'applicant@manager.invalid')
      const candidate = await user('Candidate', 'candidate@manager.invalid')
      const school = await database.drivingSchool.create({
        data: {
          name: 'Manager School', email: 'school@manager.invalid', phone: '123',
          address: 'Test address', city: 'Skopje', createdAt: new Date(), managerId: manager.id,
          categories: { connect: { id: category.id } }
        }
      })
      await database.user.update({ where: { id: instructor.id }, data: { instructorSchoolId: school.id } })
      const application = await database.application.create({
        data: { userId: applicant.id, drivingSchoolId: school.id, categoryId: category.id }
      })
      const service = new ManagerService(database)

      await t.test('searches only unassigned accounts and manages instructors', async () => {
        assert.deepEqual((await service.searchUnassignedUsers(school.id, 'candidate')).map(({ id }) => id), [candidate.id])
        await service.addInstructor(school.id, { userId: candidate.id })
        assert.equal((await database.user.findUniqueOrThrow({ where: { id: candidate.id } })).instructorSchoolId, school.id)
        assert.equal((await service.searchUnassignedUsers(school.id, 'candidate')).length, 0)
        await service.removeInstructor(school.id, candidate.id)
        assert.equal((await database.user.findUniqueOrThrow({ where: { id: candidate.id } })).instructorSchoolId, null)
      })

      let trainingId
      await t.test('approves an application with the manager-selected instructor', async () => {
        const result = await service.approveApplication(school.id, application.id, { instructorId: instructor.id })
        trainingId = result.trainingEnrollmentId
        const savedApplication = await database.application.findUniqueOrThrow({ where: { id: application.id } })
        const savedApplicant = await database.user.findUniqueOrThrow({ where: { id: applicant.id } })
        const training = await database.trainingEnrollment.findUniqueOrThrow({ where: { id: trainingId } })
        assert.equal(savedApplication.status, 'APPROVED')
        assert.equal(savedApplication.preferredInstructorId, instructor.id)
        assert.equal(savedApplicant.drivingSchoolId, school.id)
        assert.equal(training.instructorId, instructor.id)
        await assert.rejects(service.approveApplication(school.id, application.id, { instructorId: instructor.id }), { statusCode: 409 })
      })

      let vehicleId
      await t.test('manages vehicles and student programme assignments', async () => {
        const vehicle = await service.createVehicle(school.id, {
          registration: 'sk-test-01',
          brand: 'Volkswagen',
          model: 'Golf',
          year: 2024,
          instructorId: instructor.id
        })
        vehicleId = vehicle.id
        await service.updateVehicle(school.id, vehicle.id, {
          registration: 'sk-test-01',
          brand: 'Volkswagen',
          model: 'Golf 8',
          year: 2024,
          instructorId: instructor.id
        })
        await service.updateTraining(school.id, trainingId, {
          status: 'PAUSED', instructorId: instructor.id, vehicleId: vehicle.id
        })
        await service.updateTraining(school.id, trainingId, {
          status: 'ACTIVE', instructorId: instructor.id, vehicleId: vehicle.id
        })
        const [savedVehicle, savedTraining] = await Promise.all([
          database.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } }),
          database.trainingEnrollment.findUniqueOrThrow({ where: { id: trainingId } })
        ])
        assert.equal(savedVehicle.registration, 'SK-TEST-01')
        assert.equal(savedVehicle.model, 'Golf 8')
        assert.equal(savedTraining.status, 'ACTIVE')
        assert.equal(savedTraining.vehicleId, vehicle.id)
      })

      let theorySessionId, practicalSessionId
      await t.test('schedules theory without an instructor and requires one for practical lessons', async () => {
        const theoryStart = '2099-09-10T09:00:00.000Z'
        const theorySession = await service.scheduleLesson(school.id, {
          trainingEnrollmentId: trainingId,
          curriculumLessonId: theory.id,
          scheduledStart: theoryStart,
          instructorId: null,
          vehicleId: null,
          notes: 'Classroom A'
        })
        const savedTheory = await database.lessonSession.findUniqueOrThrow({ where: { id: theorySession.id } })
        theorySessionId = theorySession.id
        assert.equal(savedTheory.instructorId, null)
        assert.equal(savedTheory.scheduledEnd.getTime() - savedTheory.scheduledStart.getTime(), 45 * 60_000)
        await assert.rejects(service.scheduleLesson(school.id, {
          trainingEnrollmentId: trainingId,
          curriculumLessonId: theory.id,
          scheduledStart: '2099-09-10T09:15:00.000Z',
          instructorId: null,
          vehicleId: null,
          notes: null
        }), { statusCode: 409 })
        await assert.rejects(service.scheduleLesson(school.id, {
          trainingEnrollmentId: trainingId,
          curriculumLessonId: practical.id,
          scheduledStart: '2099-09-10T10:00:00.000Z',
          instructorId: null,
          vehicleId: null,
          notes: null
        }), { statusCode: 400 })
        const practicalSession = await service.scheduleLesson(school.id, {
          trainingEnrollmentId: trainingId,
          curriculumLessonId: practical.id,
          scheduledStart: '2099-09-10T10:00:00.000Z',
          instructorId: instructor.id,
          vehicleId: null,
          notes: null
        })
        practicalSessionId = practicalSession.id
      })

      await t.test('completes, cancels and reschedules scheduled lessons', async () => {
        const currentTime = Date.now()
        const pastSession = await database.lessonSession.create({
          data: {
            trainingEnrollmentId: trainingId,
            curriculumLessonId: theory.id,
            status: 'SCHEDULED',
            scheduledStart: new Date(currentTime - 5 * 60_000),
            scheduledEnd: new Date(currentTime + 40 * 60_000)
          }
        })
        await service.updateLesson(school.id, pastSession.id, { action: 'complete' })
        await service.updateLesson(school.id, theorySessionId, { action: 'cancel' })
        await service.updateLesson(school.id, practicalSessionId, {
          action: 'reschedule',
          scheduledStart: '2099-09-10T12:00:00.000Z',
          instructorId: instructor.id,
          vehicleId: null
        })
        const [completed, cancelled, rescheduled] = await Promise.all([
          database.lessonSession.findUniqueOrThrow({ where: { id: pastSession.id } }),
          database.lessonSession.findUniqueOrThrow({ where: { id: theorySessionId } }),
          database.lessonSession.findUniqueOrThrow({ where: { id: practicalSessionId } })
        ])
        assert.equal(completed.status, 'COMPLETED')
        assert.ok(completed.completedAt)
        assert.equal(cancelled.status, 'CANCELLED')
        assert.equal(rescheduled.scheduledStart.toISOString(), '2099-09-10T12:00:00.000Z')
        assert.equal(rescheduled.scheduledEnd.toISOString(), '2099-09-10T13:00:00.000Z')
      })

      await t.test('returns the complete manager dashboard read model', async () => {
        const overview = await service.overview(school.id)
        assert.equal(overview.view, 'MANAGER')
        assert.equal(overview.summary.activeStudents, 1)
        assert.equal(overview.summary.instructors, 1)
        assert.equal(overview.summary.vehicles, 1)
        assert.equal(overview.students.length, 1)
        assert.equal(overview.students[0].trainingAsStudent.length, 1)
        assert.equal(overview.students[0].trainingAsStudent[0].vehicle.id, vehicleId)
        assert.equal(overview.trainings[0].category.lessons.length, 2)
        assert.equal(overview.lessons.length, 3)
        assert.equal(overview.lessons.some((session) => session.status === 'COMPLETED'), true)
        assert.equal(overview.lessons.some((session) => session.status === 'CANCELLED'), true)
      })

      await t.test('safely removes students and vehicles from the school', async () => {
        await service.removeStudent(school.id, applicant.id)
        const [removedStudent, cancelledTraining, cancelledApplication, scheduledLessons] = await Promise.all([
          database.user.findUniqueOrThrow({ where: { id: applicant.id } }),
          database.trainingEnrollment.findUniqueOrThrow({ where: { id: trainingId } }),
          database.application.findUniqueOrThrow({ where: { id: application.id } }),
          database.lessonSession.count({ where: { trainingEnrollmentId: trainingId, status: 'SCHEDULED' } })
        ])
        assert.equal(removedStudent.drivingSchoolId, null)
        assert.equal(cancelledTraining.status, 'CANCELLED')
        assert.equal(cancelledApplication.status, 'CANCELLED')
        assert.equal(scheduledLessons, 0)

        await service.removeVehicle(school.id, vehicleId)
        assert.equal(await database.vehicle.findUnique({ where: { id: vehicleId } }), null)
      })
    } finally {
      if (database) await database.$disconnect()
      if (createdSchema) await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
      await client.end().catch(() => {})
    }
  }
)
