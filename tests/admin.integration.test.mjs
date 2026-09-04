import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client.ts'
import { AdminService } from '../server/services/AdminService.ts'

// Real PostgreSQL integration in a disposable, randomly named schema. Public
// tables and users are never modified; migrations are applied only in isolation.
const hash = new Hash(new Scrypt())

test(
  'admin management with real database constraints and transactions',
  { skip: !process.env.DATABASE_URL },
  async (t) => {
    const schema = `admin_test_${randomUUID().replaceAll('-', '')}`
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
    let database
    let createdSchema = false
    try {
      await client.connect()
      await client.query(`CREATE SCHEMA "${schema}"`)
      createdSchema = true
      await client.query(`SET search_path TO "${schema}"`)
      const migrations = new URL('../prisma/migrations/', import.meta.url)
      for (const directory of readdirSync(migrations)
        .filter((name) => /^\d/.test(name))
        .sort()) {
        const sql = readFileSync(
          new URL(`${directory}/migration.sql`, migrations),
          'utf8'
        ).replaceAll('"public".', `"${schema}".`)
        await client.query(sql)
      }
      database = new PrismaClient({
        adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }, { schema })
      })
      const service = new AdminService(database, (password) => hash.make(password))
      const category = await database.category.create({
        data: {
          code: 'B',
          name: 'Passenger car',
          price: 30000,
          theoryLessons: 20,
          practicalLessons: 30,
          minimumAge: 18
        }
      })
      const admin = await database.user.create({
        data: {
          name: 'Test admin',
          email: 'admin@test.invalid',
          password: 'fixture',
          role: 'ADMIN'
        }
      })
      const userInput = (email) => ({
        name: 'Test User',
        email,
        password: 'TestPass123!',
        studentSchoolId: null,
        instructorSchoolId: null,
        managedSchoolId: null
      })
      const schoolInput = (name, email) => ({
        name,
        email,
        phone: '123456',
        address: 'Test address',
        city: 'Skopje',
        description: '',
        managerId: null,
        categoryIds: [category.id]
      })
      const manager = await service.save('users', null, userInput('manager@test.invalid'))
      const student = await service.save('users', null, userInput('student@test.invalid'))
      const instructor = await service.save('users', null, userInput('instructor@test.invalid'))
      const schoolA = await service.save('schools', null, {
        ...schoolInput('School A', 'a@test.invalid'),
        managerId: manager.id
      })
      const schoolB = await service.save('schools', null, schoolInput('School B', 'b@test.invalid'))
      const updateUser = async (id, changes) => {
        const user = await database.user.findUniqueOrThrow({
          where: { id },
          include: { managedSchool: true }
        })
        return service.save('users', id, {
          name: user.name,
          email: user.email,
          studentSchoolId: user.drivingSchoolId,
          instructorSchoolId: user.instructorSchoolId,
          managedSchoolId: user.managedSchool?.id ?? null,
          ...changes
        })
      }
      const applicationInput = {
        userId: student.id,
        drivingSchoolId: schoolA.id,
        categoryId: category.id,
        preferredInstructorId: instructor.id,
        status: 'PENDING'
      }
      const vehicleInput = {
        registration: 'QA-100',
        brand: 'Test',
        model: 'Car',
        year: 2024,
        drivingSchoolId: schoolA.id,
        instructorId: instructor.id
      }
      let application, vehicle

      await t.test(
        'list data is sanitized and administrator identities are immutable',
        async () => {
          const overview = await service.overview()
          assert.equal(overview.users.length, 4)
          assert.equal(
            overview.users.some((user) => 'password' in user),
            false
          )
          await assert.rejects(service.save('users', admin.id, userInput(admin.email)), {
            statusCode: 403
          })
          await assert.rejects(service.remove('users', admin.id), { statusCode: 403 })
          await assert.rejects(
            service.save('users', null, { ...userInput('escalate@test.invalid'), role: 'ADMIN' }),
            { statusCode: 400 }
          )
        }
      )
      await t.test(
        'users and schools enforce uniqueness and ordinary-user management',
        async () => {
          await assert.rejects(service.save('users', null, userInput('student@test.invalid')), {
            statusCode: 409
          })
          await assert.rejects(
            service.save('schools', schoolB.id, {
              ...schoolInput('School B', 'b@test.invalid'),
              managerId: manager.id
            }),
            { statusCode: 409 }
          )
          await assert.rejects(
            service.save('schools', schoolB.id, {
              ...schoolInput('School B', 'b@test.invalid'),
              managerId: admin.id
            }),
            { statusCode: 403 }
          )
          await updateUser(student.id, { name: 'Updated Student' })
          assert.equal(
            (await database.user.findUniqueOrThrow({ where: { id: student.id } })).name,
            'Updated Student'
          )
          await service.save('schools', schoolB.id, {
            ...schoolInput('School B updated', 'b@test.invalid'),
            city: 'Bitola'
          })
          assert.equal(
            (await database.drivingSchool.findUniqueOrThrow({ where: { id: schoolB.id } })).city,
            'Bitola'
          )
        }
      )
      await t.test(
        'membership updates preserve unrelated fields and reject invalid assignments',
        async () => {
          const before = await database.user.findUniqueOrThrow({
            where: { id: student.id },
            include: { managedSchool: true }
          })
          await service.assignMembership(student.id, { kind: 'student', schoolId: schoolA.id })
          const after = await database.user.findUniqueOrThrow({
            where: { id: student.id },
            include: { managedSchool: true }
          })
          assert.deepEqual(after, { ...before, drivingSchoolId: schoolA.id })
          await updateUser(student.id, { studentSchoolId: null })
          await assert.rejects(
            service.assignMembership(manager.id, { kind: 'student', schoolId: schoolA.id }),
            { statusCode: 409 }
          )
          await assert.rejects(
            service.assignMembership(manager.id, { kind: 'instructor', schoolId: schoolA.id }),
            { statusCode: 409 }
          )
          await assert.rejects(
            service.assignMembership(admin.id, { kind: 'student', schoolId: schoolA.id }),
            { statusCode: 403 }
          )
          await assert.rejects(
            service.assignMembership(student.id, { kind: 'student', schoolId: 999999 }),
            { statusCode: 404 }
          )
          await assert.rejects(
            service.assignMembership(student.id, {
              kind: 'student',
              schoolId: schoolA.id,
              name: 'Overwrite'
            }),
            { statusCode: 400 }
          )
        }
      )
      await t.test(
        'all role combinations are rejected and explicit changes replace the old role',
        async () => {
          const fields = ['studentSchoolId', 'instructorSchoolId', 'managedSchoolId']
          for (const first of fields)
            for (const second of fields) {
              if (first === second) continue
              await assert.rejects(
                service.save('users', null, {
                  ...userInput('invalid@test.invalid'),
                  [first]: schoolB.id,
                  [second]: schoolB.id
                }),
                { statusCode: 400 }
              )
              await assert.rejects(
                updateUser(student.id, { [first]: schoolB.id, [second]: schoolB.id }),
                { statusCode: 400 }
              )
            }
          await updateUser(student.id, { studentSchoolId: schoolB.id })
          await assert.rejects(
            service.assignMembership(student.id, { kind: 'instructor', schoolId: schoolB.id }),
            { statusCode: 409 }
          )
          await assert.rejects(
            service.save('schools', null, {
              ...schoolInput('Conflict', 'conflict@test.invalid'),
              managerId: student.id
            }),
            { statusCode: 409 }
          )
          await assert.rejects(
            service.save('schools', schoolB.id, {
              ...schoolInput('School B', 'b@test.invalid'),
              managerId: student.id
            }),
            { statusCode: 409 }
          )
          await updateUser(student.id, { studentSchoolId: null, managedSchoolId: schoolB.id })
          await updateUser(student.id, { managedSchoolId: null, instructorSchoolId: schoolB.id })
          assert.equal(
            (await database.drivingSchool.findUniqueOrThrow({ where: { id: schoolB.id } }))
              .managerId,
            null
          )
          await assert.rejects(
            service.assignMembership(student.id, { kind: 'student', schoolId: schoolB.id }),
            { statusCode: 409 }
          )
          await assert.rejects(
            service.save('schools', schoolB.id, {
              ...schoolInput('School B', 'b@test.invalid'),
              managerId: student.id
            }),
            { statusCode: 409 }
          )
          for (const userId of [manager.id, student.id]) {
            const pending = await service.save('applications', null, {
              ...applicationInput,
              userId,
              preferredInstructorId: null
            })
            await assert.rejects(
              service.save('applications', pending.id, {
                ...applicationInput,
                userId,
                preferredInstructorId: null,
                status: 'APPROVED'
              }),
              { statusCode: 409 }
            )
            assert.equal(
              (await database.application.findUniqueOrThrow({ where: { id: pending.id } })).status,
              'PENDING'
            )
            await service.remove('applications', pending.id)
          }
          await updateUser(student.id, { instructorSchoolId: null })
        }
      )
      await t.test(
        'cross-school instructors cannot be assigned to vehicles or applications',
        async () => {
          await updateUser(instructor.id, { instructorSchoolId: schoolB.id })
          await assert.rejects(service.save('vehicles', null, vehicleInput), { statusCode: 400 })
          await assert.rejects(service.save('applications', null, applicationInput), {
            statusCode: 400
          })
          await updateUser(instructor.id, { instructorSchoolId: schoolA.id })
          vehicle = await service.save('vehicles', null, vehicleInput)
          application = await service.save('applications', null, applicationInput)
        }
      )
      await t.test(
        'approval enrolls the applicant and duplicate applications are rejected',
        async () => {
          await assert.rejects(
            service.save('applications', 999999, { ...applicationInput, status: 'APPROVED' }),
            { statusCode: 404 }
          )
          assert.equal(
            (await database.user.findUniqueOrThrow({ where: { id: student.id } })).drivingSchoolId,
            null,
            'Failed approval rolls back enrollment'
          )
          await service.save('applications', application.id, {
            ...applicationInput,
            status: 'APPROVED'
          })
          assert.equal(
            (await database.user.findUniqueOrThrow({ where: { id: student.id } })).drivingSchoolId,
            schoolA.id
          )
          await assert.rejects(service.save('applications', null, applicationInput), {
            statusCode: 409
          })
          await assert.rejects(
            service.save('applications', null, {
              ...applicationInput,
              drivingSchoolId: schoolB.id,
              preferredInstructorId: null,
              status: 'APPROVED'
            }),
            { statusCode: 409 }
          )
          await assert.rejects(
            service.save('schools', schoolA.id, {
              ...schoolInput('School A', 'a@test.invalid'),
              categoryIds: []
            }),
            { statusCode: 409 }
          )
        }
      )
      await t.test(
        'instructor transfer clears vehicle and preferred-instructor relationships',
        async () => {
          await service.assignMembership(instructor.id, {
            kind: 'instructor',
            schoolId: schoolB.id
          })
          assert.equal(
            (await database.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).instructorId,
            null
          )
          assert.equal(
            (await database.application.findUniqueOrThrow({ where: { id: application.id } }))
              .preferredInstructorId,
            null
          )
        }
      )
      await t.test(
        'vehicle edits and deletes work and application deletion preserves enrollment',
        async () => {
          await service.save('vehicles', vehicle.id, {
            ...vehicleInput,
            instructorId: null,
            model: 'Updated car'
          })
          assert.equal(
            (await database.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).model,
            'Updated car'
          )
          await service.remove('vehicles', vehicle.id)
          await service.remove('applications', application.id)
          assert.equal(
            (await database.user.findUniqueOrThrow({ where: { id: student.id } })).drivingSchoolId,
            schoolA.id
          )
        }
      )
      await t.test(
        'user deletion clears manager, instructor, and applicant relationships',
        async () => {
          await updateUser(manager.id, { instructorSchoolId: schoolA.id, managedSchoolId: null })
          vehicle = await service.save('vehicles', null, {
            ...vehicleInput,
            instructorId: manager.id
          })
          await service.save('applications', null, {
            ...applicationInput,
            preferredInstructorId: manager.id
          })
          await service.save('applications', null, {
            ...applicationInput,
            userId: manager.id,
            preferredInstructorId: null
          })
          await service.remove('users', manager.id)
          assert.equal(
            (await database.drivingSchool.findUniqueOrThrow({ where: { id: schoolA.id } }))
              .managerId,
            null
          )
          assert.equal(
            (await database.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).instructorId,
            null
          )
          assert.equal(await database.application.count({ where: { userId: manager.id } }), 0)
          assert.equal(
            await database.application.count({ where: { preferredInstructorId: manager.id } }),
            0
          )
        }
      )
      await t.test(
        'school deletion removes dependents while preserving and unassigning users',
        async () => {
          await updateUser(instructor.id, { instructorSchoolId: schoolA.id })
          await service.remove('schools', schoolA.id)
          assert.equal(await database.vehicle.count({ where: { drivingSchoolId: schoolA.id } }), 0)
          assert.equal(
            await database.application.count({ where: { drivingSchoolId: schoolA.id } }),
            0
          )
          assert.equal(
            (await database.user.findUniqueOrThrow({ where: { id: student.id } })).drivingSchoolId,
            null
          )
          assert.equal(
            (await database.user.findUniqueOrThrow({ where: { id: instructor.id } }))
              .instructorSchoolId,
            null
          )
          assert.equal(await database.drivingSchool.count(), 1)
        }
      )
    } finally {
      if (database) await database.$disconnect()
      if (createdSchema) {
        await client.query('ROLLBACK')
        await client.query(`DROP SCHEMA "${schema}" CASCADE`)
      }
      await client.end()
    }
  }
)
