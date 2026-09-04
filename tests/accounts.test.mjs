import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { saveAdministrator } from '../scripts/admin-accounts.mjs'
import { updateProfileSchema, changePasswordSchema } from '../server/validation/auth.ts'

const hash = new Hash(new Scrypt())
const oldPassword = 'Original123!'
const originalHash = await hash.make(oldPassword)

// Load the service with an in-memory repository and Nuxt's password/error
// dependencies supplied explicitly, so these checks never touch a real user.
const serviceSource = stripTypeScriptTypes(readFileSync(new URL('../server/services/AuthService.ts', import.meta.url), 'utf8'))
  .replace(/import \{ UserRepository \} from ['"][^'"]+['"];?/, '')
  .replace('export class AuthService', 'class AuthService')

function fixture(role = 'USER') {
  let record = {
    id: 42, name: 'Test Person', email: 'person@example.test', password: originalHash, role,
    drivingSchoolId: 2, instructorSchoolId: 3, managedSchool: { id: 4 }
  }
  let writes = 0
  class UserRepository {
    async findForSession() { return record }
    async updateOrdinaryUser(_id, data) {
      if (data.email === 'taken@example.test') throw { code: 'P2002' }
      writes++
      record = { ...record, ...data }
      return record
    }
  }
  const AuthService = runInNewContext(`${serviceSource}\nAuthService`, {
    UserRepository,
    createError: properties => Object.assign(new Error(properties.statusMessage), properties),
    hashPassword: password => hash.make(password),
    verifyPassword: (stored, password) => hash.verify(stored, password)
  })
  return { service: new AuthService(), record: () => record, writes: () => writes }
}

test('profile changes preserve identity, role, password and school relationships', async () => {
  const f = fixture()
  const result = await f.service.updateProfile(42, { name: '  Updated Name  ', email: 'person@example.test' })
  assert.equal(result.name, 'Updated Name')
  assert.equal(result.id, 42)
  assert.equal(result.role, 'USER')
  assert.equal(result.studentSchoolId, 2)
  assert.equal(result.instructorSchoolId, 3)
  assert.equal(result.managedSchoolId, 4)
  assert.equal(result.password, undefined)
  assert.equal(f.record().password, originalHash)
})

test('email change requires the current password and normalizes the new email', async () => {
  const f = fixture()
  await assert.rejects(f.service.updateProfile(42, { name: 'Test Person', email: 'new@example.test' }), { statusCode: 400 })
  await assert.rejects(f.service.updateProfile(42, { name: 'Test Person', email: 'new@example.test', currentPassword: 'Wrong123!' }), { statusCode: 400 })
  assert.equal(f.writes(), 0)
  const result = await f.service.updateProfile(42, { name: 'Test Person', email: ' NEW@EXAMPLE.TEST ', currentPassword: oldPassword })
  assert.equal(result.email, 'new@example.test')
})

test('duplicate email is rejected without changing the account', async () => {
  const f = fixture()
  await assert.rejects(f.service.updateProfile(42, { name: 'Changed Name', email: 'taken@example.test', currentPassword: oldPassword }), { statusCode: 409 })
  assert.equal(f.writes(), 0)
  assert.equal(f.record().email, 'person@example.test')
})

test('password change rejects incorrect and reused passwords, then stores a valid hash', async () => {
  const f = fixture()
  await assert.rejects(f.service.changePassword(42, { currentPassword: 'Wrong123!', newPassword: 'Replacement123!' }), { statusCode: 400 })
  await assert.rejects(f.service.changePassword(42, { currentPassword: oldPassword, newPassword: oldPassword }), { statusCode: 400 })
  assert.equal(f.writes(), 0)
  const result = await f.service.changePassword(42, { currentPassword: oldPassword, newPassword: 'Replacement123!' })
  assert.equal(result.password, undefined)
  assert.equal(await hash.verify(f.record().password, 'Replacement123!'), true)
  assert.equal(await hash.verify(f.record().password, oldPassword), false)
  assert.equal(f.record().drivingSchoolId, 2)
})

test('administrators cannot update profile or password through ordinary-user settings', async () => {
  const f = fixture('ADMIN')
  await assert.rejects(f.service.updateProfile(42, { name: 'Changed Admin', email: 'person@example.test' }), { statusCode: 403 })
  await assert.rejects(f.service.changePassword(42, { currentPassword: oldPassword, newPassword: 'Replacement123!' }), { statusCode: 403 })
  assert.equal(f.writes(), 0)
})

test('request validation rejects role, identity and relationship injection and weak passwords', () => {
  for (const extra of [{ role: 'ADMIN' }, { id: 1 }, { managedSchoolId: 1 }]) {
    assert.equal(updateProfileSchema.safeParse({ name: 'Test Person', email: 'person@example.test', ...extra }).success, false)
  }
  assert.equal(changePasswordSchema.safeParse({ currentPassword: oldPassword, newPassword: 'short' }).success, false)
  assert.equal(changePasswordSchema.safeParse({ currentPassword: oldPassword, newPassword: 'NoDigitsHere' }).success, false)
})

function adminClient(existing) {
  const queries = []
  return {
    queries,
    async query(sql, params) {
      queries.push({ sql, params })
      if (sql.startsWith('SELECT')) return { rows: existing ? [existing] : [] }
      if (sql.startsWith('INSERT') || sql.startsWith('UPDATE')) return { rows: [{ id: existing?.id ?? 100, role: 'ADMIN' }] }
      return { rows: [] }
    }
  }
}
const adminInput = { email: 'admin@example.test', name: 'Administrator', password: 'admin' }

test('admin CLI creates an ADMIN with a compatible password hash and no relation fields', async () => {
  const client = adminClient()
  await saveAdministrator(client, 'create', adminInput)
  const insert = client.queries.find(query => query.sql.startsWith('INSERT'))
  assert.match(insert.sql, /\(name, email, password, role\)/)
  assert.match(insert.sql, /'ADMIN'/)
  assert.equal(await hash.verify(insert.params[2], adminInput.password), true)
  assert.equal(client.queries.at(-1).sql, 'COMMIT')
})

test('admin CLI updates only an existing administrator and preserves their ID', async () => {
  const client = adminClient({ id: 77, role: 'ADMIN' })
  await saveAdministrator(client, 'update', { ...adminInput, newEmail: 'replacement@example.test' })
  const update = client.queries.find(query => query.sql.startsWith('UPDATE'))
  assert.equal(update.params[1], 'replacement@example.test')
  assert.equal(update.params[3], 77)
  assert.match(update.sql, /AND role = 'ADMIN'/)
  assert.equal(client.queries.at(-1).sql, 'COMMIT')
})

test('admin CLI never promotes ordinary users or silently overwrites existing accounts', async () => {
  for (const [mode, existing] of [
    ['create', { id: 1, role: 'USER' }], ['update', { id: 1, role: 'USER' }],
    ['create', { id: 1, role: 'ADMIN' }], ['update', undefined]
  ]) {
    const client = adminClient(existing)
    await assert.rejects(saveAdministrator(client, mode, adminInput))
    assert.equal(client.queries.some(query => /^(INSERT|UPDATE)/.test(query.sql)), false)
    assert.equal(client.queries.at(-1).sql, 'ROLLBACK')
  }
})

test('school creation rejects administrators as managers before persisting a school', async () => {
  const source = stripTypeScriptTypes(readFileSync(new URL('../server/services/DrivingSchoolService.ts', import.meta.url), 'utf8'))
    .replace(/import \{[\s\S]*?\} from ['"][^'"]+['"];?/, '')
    .replace('export class DrivingSchoolService', 'class DrivingSchoolService')
  let created = false
  class DrivingSchoolRepository {
    async findByEmail() { return null }
    async getUserById() { return { id: 1, role: 'ADMIN', managedSchool: null } }
    async create() { created = true }
  }
  const Service = runInNewContext(`${source}\nDrivingSchoolService`, {
    DrivingSchoolRepository,
    createError: properties => Object.assign(new Error(properties.statusMessage), properties)
  })
  await assert.rejects(new Service().createDrivingSchool({
    name: 'Test school', email: 'school@example.test', address: 'Test address', city: 'Skopje', phone: '123456', managerId: 1
  }), { statusCode: 400, statusMessage: 'Administrator accounts cannot be assigned to a driving school' })
  assert.equal(created, false)
})
