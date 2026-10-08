import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isTrustedProxy, normalizeProxyHeaders } from '../server/utils/proxyTrust.ts'

const headers = () => ({
  host: 'drivehub.example.com',
  'x-forwarded-proto': 'https',
  'x-forwarded-host': 'attacker.example.com',
  forwarded: 'for=127.0.0.1;proto=https',
  'x-real-ip': '127.0.0.1',
  'x-forwarded-for': '127.0.0.1, 198.51.100.5, 172.30.0.3'
})

test('forwarded headers are accepted only from the actual configured proxy peer', () => {
  const untrusted = headers()
  normalizeProxyHeaders(untrusted, '198.51.100.50', '172.30.0.0/24')
  assert.deepEqual(untrusted, { host: 'drivehub.example.com' })
  const trusted = headers()
  normalizeProxyHeaders(trusted, '::ffff:172.30.0.2', '172.30.0.0/24')
  assert.deepEqual(trusted, {
    host: 'drivehub.example.com', 'x-forwarded-proto': 'https', 'x-forwarded-for': '198.51.100.5'
  })
})

test('proxy trust supports scoped IPv4 and IPv6 and rejects malformed ranges', () => {
  assert.equal(isTrustedProxy('172.30.0.2', '172.30.0.2/32,2001:db8::/64'), true)
  assert.equal(isTrustedProxy('172.30.0.3', '172.30.0.2/32'), false)
  assert.equal(isTrustedProxy('2001:db8::123', '2001:db8::/64'), true)
  assert.equal(isTrustedProxy('2001:db9::123', '2001:db8::/64'), false)
  assert.equal(isTrustedProxy('172.30.0.2', ''), false)
  assert.throws(() => isTrustedProxy(undefined, 'not-a-cidr'), /Invalid/)
  assert.throws(() => isTrustedProxy(undefined, '172.30.0.0/100'), /Invalid/)
})

test('trusted peers cannot supply unsupported schemes or malformed client IP chains', () => {
  const request = headers()
  request['x-forwarded-proto'] = 'https,http'
  request['x-forwarded-for'] = 'invalid,172.30.0.2'
  normalizeProxyHeaders(request, '172.30.0.2', '172.30.0.0/24')
  assert.deepEqual(request, { host: 'drivehub.example.com' })
})

test('proxy middleware blocks wrong hosts and mismatched cookie modes before a route executes', async () => {
  const { readFileSync } = await import('node:fs')
  const { stripTypeScriptTypes } = await import('node:module')
  const { runInNewContext } = await import('node:vm')
  const { createApp, createError, defineEventHandler, getRequestURL, toWebHandler } = await import('h3')
  let secure = false, routeCalls = 0
  const source = stripTypeScriptTypes(readFileSync(new URL('../server/middleware/00-proxy.ts', import.meta.url), 'utf8'))
    .replace(/^import .*$/gm, '').replace('export default', 'const middleware =')
  const middleware = runInNewContext(`${source}; middleware`, {
    defineEventHandler, createError, getRequestURL, normalizeProxyHeaders, URL,
    useRuntimeConfig: () => ({ appOrigin: 'http://drivehub.example.com', trustedProxyCidrs: '', session: { cookie: { secure } } })
  })
  const handler = toWebHandler(createApp().use(middleware).use(defineEventHandler(() => { routeCalls++; return { ok: true } })))
  assert.equal((await handler(new Request('http://evil.example.com/schools', { headers: { host: 'evil.example.com' } }))).status, 421)
  assert.equal(routeCalls, 0)
  assert.equal((await handler(new Request('http://drivehub.example.com/schools', { headers: { host: 'drivehub.example.com' } }))).status, 200)
  assert.equal(routeCalls, 1)
  secure = true
  assert.equal((await handler(new Request('http://drivehub.example.com/schools', { headers: { host: 'drivehub.example.com' } }))).status, 503)
  assert.equal(routeCalls, 1)
})
