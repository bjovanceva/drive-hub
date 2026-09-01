import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import pg from 'pg'

const { Client } = pg

const categories = [
  { code: 'AM', name: 'Moped & light quadricycle', price: 18000, theoryLessons: 20, practicalLessons: 12, minimumAge: 16 },
  { code: 'A1', name: 'Light motorcycle', price: 22000, theoryLessons: 20, practicalLessons: 20, minimumAge: 16 },
  { code: 'A2', name: 'Medium motorcycle', price: 25000, theoryLessons: 20, practicalLessons: 20, minimumAge: 18 },
  { code: 'A', name: 'Motorcycle', price: 28000, theoryLessons: 20, practicalLessons: 20, minimumAge: 24 },
  { code: 'B', name: 'Passenger car', price: 33000, theoryLessons: 20, practicalLessons: 36, minimumAge: 18 },
  { code: 'BE', name: 'Car with trailer', price: 19000, theoryLessons: 4, practicalLessons: 6, minimumAge: 18 },
  { code: 'C1', name: 'Medium goods vehicle', price: 28500, theoryLessons: 4, practicalLessons: 16, minimumAge: 18 },
  { code: 'C1E', name: 'Medium goods combination', price: 22500, theoryLessons: 4, practicalLessons: 8, minimumAge: 18 },
  { code: 'C', name: 'Heavy goods vehicle', price: 38000, theoryLessons: 4, practicalLessons: 20, minimumAge: 21 },
  { code: 'CE', name: 'Heavy goods combination', price: 30000, theoryLessons: 4, practicalLessons: 8, minimumAge: 21 },
  { code: 'D1', name: 'Minibus', price: 34000, theoryLessons: 4, practicalLessons: 16, minimumAge: 21 },
  { code: 'D1E', name: 'Minibus with trailer', price: 26000, theoryLessons: 4, practicalLessons: 8, minimumAge: 21 },
  { code: 'D', name: 'Bus', price: 40000, theoryLessons: 4, practicalLessons: 20, minimumAge: 24 },
  { code: 'DE', name: 'Bus with trailer', price: 32000, theoryLessons: 4, practicalLessons: 8, minimumAge: 24 },
  { code: 'F', name: 'Tractor', price: 16000, theoryLessons: 12, practicalLessons: 12, minimumAge: 17 },
  { code: 'G', name: 'Mobile machinery', price: 16000, theoryLessons: 12, practicalLessons: 12, minimumAge: 16 },
  { code: 'T', name: 'Tram', price: 20000, theoryLessons: 20, practicalLessons: 20, minimumAge: 21 }
]

const schools = [
  {
    key: 'centar',
    name: 'Drive Hub Centar',
    email: 'centar.school@drivehub.test',
    description: 'Development driving school for passenger-car and motorcycle training.',
    phone: '+389 2 310 1001',
    address: 'Partizanski Odredi 25',
    city: 'Skopje',
    categoryCodes: ['AM', 'A1', 'A2', 'A', 'B', 'BE']
  },
  {
    key: 'vardar',
    name: 'Drive Hub Vardar',
    email: 'vardar.school@drivehub.test',
    description: 'Development driving school with passenger and commercial programmes.',
    phone: '+389 43 210 202',
    address: 'Blagoj Gjorev 80',
    city: 'Veles',
    categoryCodes: ['B', 'BE', 'C1', 'C1E', 'C', 'CE']
  },
  {
    key: 'pelagonija',
    name: 'Drive Hub Pelagonija',
    email: 'pelagonija.school@drivehub.test',
    description: 'Development school covering motorcycle, passenger and bus training.',
    phone: '+389 47 220 303',
    address: 'Partizanska 42',
    city: 'Bitola',
    categoryCodes: ['A1', 'A2', 'A', 'B', 'C', 'D']
  },
  {
    key: 'shar',
    name: 'Drive Hub Shar',
    email: 'shar.school@drivehub.test',
    description: 'Development driving school for the Polog region.',
    phone: '+389 44 330 404',
    address: 'Ilindenska 105',
    city: 'Tetovo',
    categoryCodes: ['AM', 'A1', 'A2', 'A', 'B']
  },
  {
    key: 'ohrid',
    name: 'Drive Hub Ohrid',
    email: 'ohrid.school@drivehub.test',
    description: 'Development school with passenger, trailer and bus programmes.',
    phone: '+389 46 440 505',
    address: 'Turistichka 66',
    city: 'Ohrid',
    categoryCodes: ['B', 'BE', 'D1', 'D']
  }
]

const vehicles = [
  { registration: 'SK-1001-DH', brand: 'Volkswagen', model: 'Golf', year: 2023, schoolKey: 'centar', instructorEmail: 'instructor@drivehub.test' },
  { registration: 'SK-1002-DH', brand: 'Toyota', model: 'Yaris', year: 2024, schoolKey: 'centar', instructorEmail: 'instructor@drivehub.test' },
  { registration: 'VE-2001-DH', brand: 'MAN', model: 'TGL', year: 2021, schoolKey: 'vardar' },
  { registration: 'BT-3001-DH', brand: 'Skoda', model: 'Fabia', year: 2022, schoolKey: 'pelagonija' },
  { registration: 'TE-4001-DH', brand: 'Renault', model: 'Clio', year: 2023, schoolKey: 'shar' },
  { registration: 'OH-5001-DH', brand: 'Volkswagen', model: 'Polo', year: 2024, schoolKey: 'ohrid' }
]

function requireEnvironment() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Add it to .env before seeding.')
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error('Development seed blocked in production. Set ALLOW_PRODUCTION_SEED=true only if this is intentional.')
  }
}

async function upsertCategory(client, category) {
  const result = await client.query(
    `INSERT INTO "Category"
      ("code", "name", "price", "theoryLessons", "practicalLessons", "minimumAge")
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT ("code") DO UPDATE SET
       "name" = EXCLUDED."name",
       "price" = EXCLUDED."price",
       "theoryLessons" = EXCLUDED."theoryLessons",
       "practicalLessons" = EXCLUDED."practicalLessons",
       "minimumAge" = EXCLUDED."minimumAge"
     RETURNING "id"`,
    [category.code, category.name, category.price, category.theoryLessons, category.practicalLessons, category.minimumAge]
  )

  return result.rows[0].id
}

async function upsertSchool(client, school) {
  const result = await client.query(
    `INSERT INTO "DrivingSchool"
      ("name", "email", "description", "phone", "address", "city", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("email") DO UPDATE SET
       "name" = EXCLUDED."name",
       "description" = EXCLUDED."description",
       "phone" = EXCLUDED."phone",
       "address" = EXCLUDED."address",
       "city" = EXCLUDED."city"
     RETURNING "id"`,
    [school.name, school.email, school.description, school.phone, school.address, school.city, new Date('2026-01-15T09:00:00Z')]
  )

  return result.rows[0].id
}

async function replaceSchoolCategories(client, schoolId, categoryIds) {
  await client.query('DELETE FROM "_CategoryToDrivingSchool" WHERE "B" = $1', [schoolId])

  for (const categoryId of categoryIds) {
    await client.query(
      `INSERT INTO "_CategoryToDrivingSchool" ("A", "B")
       VALUES ($1, $2)
       ON CONFLICT ("A", "B") DO NOTHING`,
      [categoryId, schoolId]
    )
  }
}

async function upsertUser(client, user, passwordHash) {
  const result = await client.query(
    `INSERT INTO "User"
      ("name", "email", "password", "role", "drivingSchoolId", "instructorSchoolId")
     VALUES ($1, $2, $3, $4::"UserRole", $5, $6)
     ON CONFLICT ("email") DO UPDATE SET
       "name" = EXCLUDED."name",
       "password" = EXCLUDED."password",
       "role" = EXCLUDED."role",
       "drivingSchoolId" = EXCLUDED."drivingSchoolId",
       "instructorSchoolId" = EXCLUDED."instructorSchoolId"
     RETURNING "id"`,
    [user.name, user.email, passwordHash, user.role, user.studentSchoolId, user.instructorSchoolId]
  )

  return result.rows[0].id
}

async function upsertVehicle(client, vehicle, schoolIds, userIds) {
  await client.query(
    `INSERT INTO "Vehicle"
      ("registration", "brand", "model", "year", "drivingSchoolId", "instructorId")
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT ("registration") DO UPDATE SET
       "brand" = EXCLUDED."brand",
       "model" = EXCLUDED."model",
       "year" = EXCLUDED."year",
       "drivingSchoolId" = EXCLUDED."drivingSchoolId",
       "instructorId" = EXCLUDED."instructorId"`,
    [
      vehicle.registration,
      vehicle.brand,
      vehicle.model,
      vehicle.year,
      schoolIds.get(vehicle.schoolKey),
      vehicle.instructorEmail ? userIds.get(vehicle.instructorEmail) : null
    ]
  )
}

async function upsertApplication(client, application, userIds, schoolIds, categoryIds) {
  await client.query(
    `INSERT INTO "Application"
      ("status", "startedAt", "userId", "drivingSchoolId", "categoryId")
     VALUES ($1::"ApplicationStatus", $2, $3, $4, $5)
     ON CONFLICT ("userId", "drivingSchoolId", "categoryId") DO UPDATE SET
       "status" = EXCLUDED."status",
       "startedAt" = EXCLUDED."startedAt"`,
    [
      application.status,
      new Date(application.startedAt),
      userIds.get(application.userEmail),
      schoolIds.get(application.schoolKey),
      categoryIds.get(application.categoryCode)
    ]
  )
}

/** Seeds a complete, repeatable local dataset in one database transaction. */
async function seed() {
  requireEnvironment()

  const client = new Client({ connectionString: process.env.DATABASE_URL })
  const password = process.env.SEED_DEFAULT_PASSWORD ?? 'DriveHub123!'
  const passwordHash = await new Hash(new Scrypt()).make(password)

  await client.connect()
  await client.query('BEGIN')

  try {
    const categoryIds = new Map()
    for (const category of categories) {
      categoryIds.set(category.code, await upsertCategory(client, category))
    }

    const schoolIds = new Map()
    for (const school of schools) {
      const schoolId = await upsertSchool(client, school)
      schoolIds.set(school.key, schoolId)
      await replaceSchoolCategories(
        client,
        schoolId,
        school.categoryCodes.map(code => categoryIds.get(code))
      )
    }

    const users = [
      { name: 'Ana Applicant', email: 'applicant@drivehub.test', role: 'USER', studentSchoolId: null, instructorSchoolId: null },
      { name: 'Stefan Student', email: 'student@drivehub.test', role: 'USER', studentSchoolId: schoolIds.get('centar'), instructorSchoolId: null },
      { name: 'Elena Instructor', email: 'instructor@drivehub.test', role: 'USER', studentSchoolId: null, instructorSchoolId: schoolIds.get('centar') },
      { name: 'Marko School Manager', email: 'manager@drivehub.test', role: 'USER', studentSchoolId: null, instructorSchoolId: null },
      { name: 'Global Administrator', email: 'admin@drivehub.test', role: 'ADMIN', studentSchoolId: null, instructorSchoolId: null }
    ]

    const userIds = new Map()
    for (const user of users) {
      userIds.set(user.email, await upsertUser(client, user, passwordHash))
    }

    await client.query(
      'UPDATE "DrivingSchool" SET "managerId" = $1 WHERE "id" = $2',
      [userIds.get('manager@drivehub.test'), schoolIds.get('centar')]
    )

    for (const vehicle of vehicles) {
      await upsertVehicle(client, vehicle, schoolIds, userIds)
    }

    const applications = [
      { userEmail: 'applicant@drivehub.test', schoolKey: 'centar', categoryCode: 'B', status: 'PENDING', startedAt: '2026-08-25T10:00:00Z' },
      { userEmail: 'applicant@drivehub.test', schoolKey: 'vardar', categoryCode: 'C', status: 'REJECTED', startedAt: '2026-07-10T11:30:00Z' },
      { userEmail: 'applicant@drivehub.test', schoolKey: 'pelagonija', categoryCode: 'B', status: 'CANCELLED', startedAt: '2026-06-14T08:45:00Z' },
      { userEmail: 'student@drivehub.test', schoolKey: 'centar', categoryCode: 'B', status: 'APPROVED', startedAt: '2026-05-05T09:15:00Z' }
    ]

    for (const application of applications) {
      await upsertApplication(client, application, userIds, schoolIds, categoryIds)
    }

    await client.query('COMMIT')
    console.log(`Seed complete: ${categories.length} categories, ${schools.length} schools, ${users.length} users, ${vehicles.length} vehicles, ${applications.length} applications.`)
    console.log('Development users: applicant, student, instructor, manager and admin @drivehub.test')
    console.log('Password: SEED_DEFAULT_PASSWORD or the documented local default.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

seed().catch((error) => {
  console.error('Database seed failed:', error)
  process.exitCode = 1
})
