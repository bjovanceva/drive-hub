import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import { ref, shallowRef, readonly } from 'vue'
import { registerUserSchema, loginUserSchema } from '../shared/validation/auth.ts'
import { readAuthBody } from '../server/utils/authValidation.ts'
import { authErrorMessage, authFieldErrors } from '../app/utils/authPresentation.ts'
import { createApp, defineEventHandler, toWebHandler } from 'h3'

test('registration API returns readable field errors without persisting invalid input', async () => {
  let writes = 0
  const app = createApp().use(defineEventHandler(async event => {
    const input = await readAuthBody(event, registerUserSchema)
    writes++
    return input
  }))
  const response = await toWebHandler(app)(new Request('http://localhost/register', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'A', email: 'invalid', password: 'abcdefgh' })
  }))
  assert.equal(response.status, 400)
  const data = await response.json()
  assert.equal(writes, 0)
  assert.equal(data.statusMessage, 'Full name must contain at least 2 characters')
  const fields = authFieldErrors({ data })
  assert.deepEqual(fields, {
    name: 'Full name must contain at least 2 characters',
    email: 'Enter a valid email address',
    password: 'Password must contain at least one number'
  })
  assert.equal(authErrorMessage({ data }, 'Fallback'), data.statusMessage)
  assert.deepEqual(authFieldErrors(null), {})
})

test('shared validation normalizes credentials and explains password and email rules', () => {
  assert.equal(registerUserSchema.parse({ name: ' Full Name ', email: ' TEST@EXAMPLE.COM ', password: 'Password123' }).email, 'test@example.com')
  for (const [password, message] of [['short1', 'Password must contain at least 8 characters'], ['12345678', 'Password must contain at least one letter'], ['abcdefgh', 'Password must contain at least one number']]) {
    const result = registerUserSchema.safeParse({ name: 'Test Person', email: 'test@example.com', password })
    assert.equal(result.success, false)
    assert.equal(result.error.issues[0].message, message)
  }
  assert.equal(loginUserSchema.safeParse({ email: 'invalid', password: '123' }).error.issues[0].message, 'Enter a valid email address')
})

function fixture(saved) {
  const session = { loggedIn: ref(false), user: ref(null), ready: ref(true), fetch: async () => { session.loggedIn.value = saved } }
  const source = stripTypeScriptTypes(readFileSync(new URL('../app/composables/useAuth.ts', import.meta.url), 'utf8')).replace('export function', 'function')
  const useAuth = runInNewContext(`${source}; useAuth`, {
    ref, shallowRef, readonly, useUserSession: () => session, $fetch: async () => ({ user: { id: 1 } })
  })
  return useAuth()
}

test('login cannot report success when the session cookie is not saved', async () => {
  const auth = fixture(false)
  await assert.rejects(auth.login({ email: 'test@example.com', password: 'Password123' }), /Allow cookies and use the configured app address/)
  assert.equal(auth.mutationStatus.value, 'error')
  await assert.rejects(auth.register({ name: 'Test Person', email: 'test@example.com', password: 'Password123' }), /account was created/)
  await auth.logout()
  assert.equal(auth.mutationStatus.value, 'success')
  const working = fixture(true)
  await working.login({ email: 'test@example.com', password: 'Password123' })
  assert.equal(working.mutationStatus.value, 'success')
})

test('login API reports email and password problems and presentation hides server internals', async () => {
  const app = createApp().use(defineEventHandler(event => readAuthBody(event, loginUserSchema)))
  const response = await toWebHandler(app)(new Request('http://localhost/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'invalid', password: '' })
  }))
  assert.equal(response.status, 400)
  const data = await response.json()
  assert.deepEqual(authFieldErrors({ data }), { email: 'Enter a valid email address', password: 'Enter your password' })
  assert.equal(authErrorMessage({ data: { statusCode: 500, statusMessage: 'Database connection details' } }, 'Unable to sign in. Please try again.'), 'Unable to sign in. Please try again.')
  assert.equal(authErrorMessage({ name: 'FetchError', message: '[POST] /api/auth/login: failed' }, 'Fallback'), 'Cannot reach the server. Check your connection and try again.')
  assert.equal(authErrorMessage({ data: { statusCode: 401, statusMessage: 'Invalid email or password' } }, 'Fallback'), 'Invalid email or password')
})
