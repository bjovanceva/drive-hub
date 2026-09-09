import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client.ts'
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'

// Exercise the real built Nitro router, authentication, validation and persistence.
// Every record lives in a disposable schema; the application's public data is untouched.
test(
  'admin HTTP routes and commands',
  { skip: !process.env.DATABASE_URL, timeout: 60000 },
  async (t) => {
    const schema = `admin_http_${randomUUID().replaceAll('-', '')}`
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
    let database,
      server,
      createdSchema = false
    let serverOutput = ''
    try {
      await client.connect()
      await client.query(`CREATE SCHEMA "${schema}"`)
      createdSchema = true
      await client.query(`SET search_path TO "${schema}"`)
      const migrations = new URL('../prisma/migrations/', import.meta.url)
      for (const directory of readdirSync(migrations)
        .filter((name) => /^\d/.test(name))
        .sort()) {
        await client.query(
          readFileSync(new URL(`${directory}/migration.sql`, migrations), 'utf8').replaceAll(
            '"public".',
            `"${schema}".`
          )
        )
      }
      database = new PrismaClient({
        adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }, { schema })
      })
      const password = 'HttpTest123!'
      const hash = await new Hash(new Scrypt()).make(password)
      const admin = await database.user.create({
        data: { name: 'HTTP Admin', email: 'admin@http.invalid', role: 'ADMIN', password: hash }
      })
      const ordinary = await database.user.create({
        data: { name: 'HTTP User', email: 'ordinary@http.invalid', role: 'USER', password: hash }
      })
      const category = await database.category.create({
        data: {
          code: 'B',
          name: 'Car',
          price: 100,
          theoryLessons: 20,
          practicalLessons: 30,
          minimumAge: 18
        }
      })
      const socket = createServer()
      socket.listen(0, '127.0.0.1')
      await once(socket, 'listening')
      const port = socket.address().port
      await new Promise((resolve) => socket.close(resolve))
      const databaseUrl = new URL(process.env.DATABASE_URL)
      databaseUrl.searchParams.set('schema', schema)
      server = spawn(process.execPath, ['.output/server/index.mjs'], {
        cwd: new URL('..', import.meta.url),
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl.href,
          NITRO_HOST: '127.0.0.1',
          NITRO_PORT: String(port),
          NUXT_SESSION_PASSWORD: randomUUID() + randomUUID()
        },
        stdio: ['ignore', 'pipe', 'pipe']
      })
      server.stdout.on('data', (chunk) => {
        serverOutput += chunk
      })
      server.stderr.on('data', (chunk) => {
        serverOutput += chunk
      })
      const base = `http://127.0.0.1:${port}`
      for (let attempt = 0; ; attempt++) {
        try {
          await fetch(`${base}/api/admin/overview`)
          break
        } catch {
          if (attempt > 100 || server.exitCode !== null)
            throw new Error(`Test server failed to start: ${serverOutput}`)
          await delay(100)
        }
      }
      async function login(email) {
        const response = await fetch(`${base}/api/auth/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        assert.equal(response.status, 200, await response.text())
        return response.headers
          .getSetCookie()
          .map((cookie) => cookie.split(';')[0])
          .join('; ')
      }
      const adminCookie = await login(admin.email)
      const ordinaryCookie = await login(ordinary.email)
      async function request(
        path,
        method = 'GET',
        body,
        expected = method === 'POST' ? 201 : 200,
        cookie = adminCookie
      ) {
        const response = await fetch(base + path, {
          method,
          headers: { 'content-type': 'application/json', cookie },
          ...(body === undefined ? {} : { body: JSON.stringify(body) })
        })
        const text = await response.text()
        assert.equal(response.status, expected, `${method} ${path}: ${text}`)
        return JSON.parse(text)
      }
      const userInput = (email) => ({
        name: 'HTTP Person',
        email,
        password,
        studentSchoolId: null,
        instructorSchoolId: null,
        managedSchoolId: null
      })
      const schoolInput = {
        name: 'HTTP School',
        email: 'school@http.invalid',
        phone: '123',
        address: 'Test address',
        city: 'Skopje',
        description: '',
        managerId: null,
        categoryIds: [category.id]
      }
      let student, instructor, manager, school, application, vehicle
      await t.test(
        'every admin command resolves and requires administrator authentication',
        async () => {
          const commands = [['/api/admin/overview', 'GET']]
          for (const resource of ['users', 'schools', 'vehicles', 'applications']) {
            commands.push(
              [`/api/admin/${resource}`, 'POST'],
              [`/api/admin/${resource}/2`, 'PATCH'],
              [`/api/admin/${resource}/2`, 'DELETE']
            )
          }
          commands.push(['/api/admin/users/2/membership', 'PATCH'])
          for (const [path, method] of commands) {
            await request(path, method, method === 'GET' ? undefined : {}, 401, '')
            await request(path, method, method === 'GET' ? undefined : {}, 403, ordinaryCookie)
          }
          await request('/api/dashboard', 'GET', undefined, 401, '')
          await request('/api/dashboard', 'GET', undefined, 403, adminCookie)
          assert.equal(
            (await request('/api/dashboard', 'GET', undefined, 200, ordinaryCookie)).view,
            'APPLICANT'
          )
          const overview = await request('/api/admin/overview')
          assert.equal(overview.users.length, 2, 'Server must use the isolated schema')
          assert.equal(
            overview.users.some((user) => 'password' in user),
            false
          )
        }
      )
      await t.test(
        'users and schools can be added and edited through their actual routes',
        async () => {
          student = await request('/api/admin/users', 'POST', userInput('student@http.invalid'))
          instructor = await request(
            '/api/admin/users',
            'POST',
            userInput('instructor@http.invalid')
          )
          manager = await request('/api/admin/users', 'POST', userInput('manager@http.invalid'))
          await request(`/api/admin/users/${student.id}`, 'PATCH', {
            ...userInput('student@http.invalid'),
            name: 'Edited student'
          })
          school = await request('/api/admin/schools', 'POST', schoolInput)
          await request(`/api/admin/schools/${school.id}`, 'PATCH', {
            ...schoolInput,
            name: 'Edited school',
            managerId: manager.id
          })
          await request(`/api/admin/users/${instructor.id}/membership`, 'PATCH', {
            kind: 'instructor',
            schoolId: school.id
          })
          await request(`/api/admin/users/${student.id}/membership`, 'PATCH', {
            kind: 'student',
            schoolId: school.id
          })
          assert.equal(
            (await database.user.findUniqueOrThrow({ where: { id: student.id } })).name,
            'Edited student'
          )
          assert.equal(
            (await database.drivingSchool.findUniqueOrThrow({ where: { id: school.id } }))
              .managerId,
            manager.id
          )
        }
      )
      await t.test('all entry points reject mixed school roles', async () => {
        await request(
          `/api/admin/users/${student.id}`,
          'PATCH',
          {
            ...userInput('student@http.invalid'),
            studentSchoolId: school.id,
            instructorSchoolId: school.id
          },
          400
        )
        await request(
          `/api/admin/users/${student.id}/membership`,
          'PATCH',
          { kind: 'instructor', schoolId: school.id },
          409
        )
        await request(
          `/api/admin/users/${manager.id}/membership`,
          'PATCH',
          { kind: 'student', schoolId: school.id },
          409
        )
        await request(
          `/api/admin/schools/${school.id}`,
          'PATCH',
          { ...schoolInput, managerId: instructor.id },
          409
        )
        await request(
          '/api/driving-schools',
          'POST',
          { ...schoolInput, email: 'legacy@http.invalid', managerId: student.id },
          409
        )
        await request(
          '/api/admin/applications',
          'POST',
          {
            userId: manager.id,
            drivingSchoolId: school.id,
            categoryId: category.id,
            preferredInstructorId: null,
            status: 'APPROVED'
          },
          409
        )
        await request(`/api/admin/users/${admin.id}`, 'PATCH', userInput(admin.email), 403)
        await request(`/api/admin/users/${admin.id}`, 'DELETE', undefined, 403)
      })
      await t.test('vehicles and applications can be added, edited and approved', async () => {
        const vehicleInput = {
          registration: 'HTTP-100',
          brand: 'Test',
          model: 'Car',
          year: 2024,
          drivingSchoolId: school.id,
          instructorId: instructor.id
        }
        vehicle = await request('/api/admin/vehicles', 'POST', vehicleInput)
        await request(`/api/admin/vehicles/${vehicle.id}`, 'PATCH', {
          ...vehicleInput,
          model: 'Edited car'
        })
        const applicationInput = {
          userId: student.id,
          drivingSchoolId: school.id,
          categoryId: category.id,
          preferredInstructorId: instructor.id,
          status: 'PENDING'
        }
        application = await request('/api/admin/applications', 'POST', applicationInput)
        await request(`/api/admin/applications/${application.id}`, 'PATCH', {
          ...applicationInput,
          status: 'APPROVED'
        })
        assert.equal(
          (await database.application.findUniqueOrThrow({ where: { id: application.id } })).status,
          'APPROVED'
        )
        assert.equal(
          (await database.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).model,
          'Edited car'
        )
      })
      await t.test('student dashboard returns only the signed-in student training progress', async () => {
        const firstLesson = await database.curriculumLesson.create({
          data: {
            categoryId: category.id,
            sequence: 1,
            type: 'THEORY',
            title: 'Road signs',
            concept: 'Regulatory and warning signs',
            goal: 'Recognize common road signs',
            durationMinutes: 45
          }
        })
        const secondLesson = await database.curriculumLesson.create({
          data: {
            categoryId: category.id,
            sequence: 2,
            type: 'PRACTICAL',
            title: 'Vehicle controls',
            concept: 'Primary vehicle controls',
            goal: 'Move the vehicle safely',
            durationMinutes: 60
          }
        })
        const training = await database.trainingEnrollment.findUniqueOrThrow({
          where: { applicationId: application.id }
        })
        await database.lessonSession.createMany({
          data: [
            {
              trainingEnrollmentId: training.id,
              curriculumLessonId: firstLesson.id,
              instructorId: instructor.id,
              vehicleId: vehicle.id,
              status: 'COMPLETED',
              scheduledStart: new Date('2026-09-01T08:00:00Z'),
              scheduledEnd: new Date('2026-09-01T08:45:00Z'),
              startedAt: new Date('2026-09-01T08:00:00Z'),
              completedAt: new Date('2026-09-01T08:45:00Z')
            },
            {
              trainingEnrollmentId: training.id,
              curriculumLessonId: secondLesson.id,
              instructorId: instructor.id,
              vehicleId: vehicle.id,
              status: 'SCHEDULED',
              scheduledStart: new Date('2099-09-10T09:00:00Z'),
              scheduledEnd: new Date('2099-09-10T10:00:00Z')
            }
          ]
        })
        const studentCookie = await login('student@http.invalid')
        const dashboard = await request(
          '/api/dashboard',
          'GET',
          undefined,
          200,
          studentCookie
        )
        assert.equal(dashboard.view, 'STUDENT')
        assert.equal(dashboard.trainings.length, 1)
        assert.equal(dashboard.trainings[0].school.id, school.id)
        assert.equal(dashboard.trainings[0].instructor.id, instructor.id)
        assert.equal(dashboard.trainings[0].progress.completedLessons, 1)
        assert.equal(dashboard.trainings[0].progress.requiredLessons, 50)
        assert.equal(dashboard.trainings[0].nextLesson.id, secondLesson.id)
        assert.equal(dashboard.trainings[0].lessons[0].completed, true)
        assert.equal(dashboard.trainings[0].upcomingSession.status, 'SCHEDULED')
      })
      await t.test(
        'changing role replaces the old assignment and clears instructor links',
        async () => {
          await request(`/api/admin/users/${instructor.id}`, 'PATCH', {
            ...userInput('instructor@http.invalid'),
            studentSchoolId: school.id
          })
          const user = await database.user.findUniqueOrThrow({ where: { id: instructor.id } })
          assert.equal(user.instructorSchoolId, null)
          assert.equal(user.drivingSchoolId, school.id)
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
      await t.test('every resource can be deleted and disappears from the overview', async () => {
        for (const [resource, id] of [
          ['applications', application.id],
          ['vehicles', vehicle.id],
          ['users', manager.id],
          ['users', student.id],
          ['users', instructor.id],
          ['schools', school.id]
        ]) {
          await request(`/api/admin/${resource}/${id}`, 'DELETE')
        }
        const overview = await request('/api/admin/overview')
        assert.equal(overview.users.length, 2)
        assert.equal(
          overview.schools.length + overview.vehicles.length + overview.applications.length,
          0
        )
      })
    } finally {
      if (server && server.exitCode === null) {
        const stopped = once(server, 'exit')
        server.kill('SIGTERM')
        await stopped
      }
      if (database) await database.$disconnect()
      if (createdSchema) await client.query(`DROP SCHEMA "${schema}" CASCADE`)
      await client.end()
    }
  }
)
