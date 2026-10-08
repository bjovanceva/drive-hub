import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const root = new URL('../', import.meta.url)
let realDocker
try {
  realDocker = execFileSync('sh', ['-c', 'command -v docker'], { encoding: 'utf8' }).trim()
  execFileSync(realDocker, ['compose', 'version'], { stdio: 'ignore' })
} catch {
  realDocker = undefined
}

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'drivehub-setup-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const bin = join(dir, 'bin')
  mkdirSync(bin)
  copyFileSync(new URL('setup-vm.sh', root), join(dir, 'setup-vm.sh'))
  copyFileSync(new URL('docker-compose.prod.yml', root), join(dir, 'docker-compose.prod.yml'))
  const executable = (name, content) => {
    writeFileSync(join(bin, name), content)
    chmodSync(join(bin, name), 0o755)
  }
  executable('uname', '#!/bin/sh\necho Linux\n')
  executable('dockerd', '#!/bin/sh\nexit 0\n')
  executable('docker', `#!/usr/bin/env node
const fs = require('node:fs')
const { spawnSync } = require('node:child_process')
const args = process.argv.slice(2)
fs.appendFileSync(process.env.SETUP_TEST_LOG, JSON.stringify(args) + '\\n')
if (args.includes('config')) {
  const result = spawnSync(process.env.SETUP_REAL_DOCKER, args, { stdio: 'inherit' })
  process.exit(result.status ?? 1)
}
if (args.includes(process.env.SETUP_FAIL_COMMAND || '__never__')) process.exit(1)
process.exit(0)
`)
  // Any unexpected package or privilege operation fails instead of touching the host.
  for (const command of ['sudo', 'apt-get', 'systemctl', 'curl']) {
    executable(command, '#!/bin/sh\necho "Unexpected provisioning operation" >&2\nexit 99\n')
  }
  const envFile = join(dir, '.env.production')
  const logFile = join(dir, 'commands.jsonl')
  const run = (args = [], extraEnv = {}) => spawnSync('bash', [join(dir, 'setup-vm.sh'), ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SETUP_REAL_DOCKER: realDocker, SETUP_TEST_LOG: logFile, ...extraEnv },
    timeout: 15000
  })
  const commands = () => readFileSync(logFile, 'utf8').trim().split('\n').map(line => JSON.parse(line))
  const readConfig = () => JSON.parse(execFileSync(realDocker, ['compose', '--env-file', envFile, '-f', join(dir, 'docker-compose.prod.yml'), 'config', '--format', 'json'], { encoding: 'utf8' }))
  return { dir, envFile, run, commands, readConfig }
}

const images = ['--app-image', 'example/drive-hub-app:1.0.0', '--tooling-image', 'example/drive-hub-tooling:1.0.0']
const composeTest = (name, fn) => test(name, { skip: !realDocker && 'Docker Compose CLI is needed; no daemon is used' }, fn)

test('help is available without provisioning or a Linux host', () => {
  const result = spawnSync('bash', [new URL('../setup-vm.sh', import.meta.url).pathname, '--help'], { encoding: 'utf8' })
  assert.equal(result.status, 0)
  assert.match(result.stdout, /--app-image/)
})

composeTest('first deployment generates private secrets and waits for a healthy stack', t => {
  const setup = fixture(t)
  const result = setup.run([...images, '--port', '8080', '--bind-address', '127.0.0.1'])
  assert.equal(result.status, 0, result.stderr)
  const config = setup.readConfig()
  const values = config.services.app.environment
  assert.match(values.POSTGRES_PASSWORD, /^[0-9a-f]{64}$/)
  assert.match(values.NUXT_SESSION_PASSWORD, /^[0-9a-f]{64}$/)
  assert.notEqual(values.POSTGRES_PASSWORD, values.NUXT_SESSION_PASSWORD)
  assert.equal(statSync(setup.envFile).mode & 0o777, 0o600)
  assert.equal(config.services.app.ports[0].published, '8080')
  assert.equal(config.services.app.ports[0].host_ip, '127.0.0.1')
  assert.ok(setup.commands().some(args => args.includes('pull')))
  assert.ok(setup.commands().some(args => args.includes('up') && args.includes('--no-build') && args.includes('--wait')))
  assert.ok(!result.stdout.includes(values.POSTGRES_PASSWORD))
  assert.match(result.stdout, /Drive Hub is healthy/)
})

composeTest('reruns preserve credentials, comments, and unrelated configuration', t => {
  const setup = fixture(t)
  assert.equal(setup.run(images).status, 0)
  const before = readFileSync(setup.envFile, 'utf8') + '\n# Custom setting\nCUSTOM_SETTING=keep-me\n'
  writeFileSync(setup.envFile, before)
  const rerun = setup.run([])
  assert.equal(rerun.status, 0, rerun.stderr)
  assert.equal(readFileSync(setup.envFile, 'utf8'), before)
  const update = setup.run(['--app-image', 'example/drive-hub-app:2.0.0', '--tooling-image', 'example/drive-hub-tooling:2.0.0'])
  assert.equal(update.status, 0, update.stderr)
  const after = readFileSync(setup.envFile, 'utf8')
  assert.ok(after.includes('CUSTOM_SETTING=keep-me'))
  for (const key of ['POSTGRES_PASSWORD', 'NUXT_SESSION_PASSWORD']) {
    assert.equal(after.match(new RegExp(`^${key}=.*$`, 'm'))[0], before.match(new RegExp(`^${key}=.*$`, 'm'))[0])
  }
})

composeTest('dotenv credentials are parsed without executing shell expressions', t => {
  const setup = fixture(t)
  const marker = join(setup.dir, 'must-not-exist')
  writeFileSync(setup.envFile, `POSTGRES_PASSWORD='$(touch ${marker})@:/?#%$'\nNUXT_SESSION_PASSWORD='01234567890123456789012345678901'\n`)
  const result = setup.run(images)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(existsSync(marker), false)
  assert.ok(readFileSync(setup.envFile, 'utf8').includes(`POSTGRES_PASSWORD='$(touch ${marker})@:/?#%$'`))
})

composeTest('empty values with inline comments receive generated credentials', t => {
  const setup = fixture(t)
  writeFileSync(setup.envFile, 'POSTGRES_PASSWORD="" # Generate this\nNUXT_SESSION_PASSWORD="" # Generate this too\n')
  const result = setup.run(images)
  assert.equal(result.status, 0, result.stderr)
  assert.match(setup.readConfig().services.app.environment.POSTGRES_PASSWORD, /^[0-9a-f]{64}$/)
})

composeTest('invalid existing session secrets abort without changing the file or starting containers', t => {
  const setup = fixture(t)
  const original = 'POSTGRES_PASSWORD=keep-this\nNUXT_SESSION_PASSWORD=too-short\n'
  writeFileSync(setup.envFile, original)
  const result = setup.run(images)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /too short/)
  assert.equal(readFileSync(setup.envFile, 'utf8'), original)
  assert.ok(!setup.commands().some(args => args.includes('pull') || args.includes('up')))
})

composeTest('a failed image pull preserves generated credentials and never starts containers', t => {
  const setup = fixture(t)
  const result = setup.run(images, { SETUP_FAIL_COMMAND: 'pull' })
  assert.notEqual(result.status, 0)
  assert.ok(!setup.commands().some(args => args.includes('up')))
  const before = readFileSync(setup.envFile, 'utf8')
  assert.equal(setup.run().status, 0)
  assert.equal(readFileSync(setup.envFile, 'utf8'), before)
})

composeTest('startup failure does not report success or create an administrator', t => {
  const setup = fixture(t)
  const result = setup.run([...images, '--admin-email', 'admin@example.com'], { SETUP_FAIL_COMMAND: 'up' })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Startup failed/)
  assert.ok(!result.stdout.includes('Drive Hub is healthy'))
  assert.ok(!setup.commands().some(args => args.includes('run')))
})

composeTest('optional registry login precedes pulling and administrator creation follows startup', t => {
  const setup = fixture(t)
  const result = setup.run([...images, '--login', '--admin-email', 'admin@example.com'])
  assert.equal(result.status, 0, result.stderr)
  const commands = setup.commands()
  assert.ok(commands.findIndex(args => args.includes('login')) < commands.findIndex(args => args.includes('pull')))
  assert.ok(commands.findIndex(args => args.includes('up')) < commands.findIndex(args => args.includes('run')))
  assert.ok(commands.some(args => args.includes('scripts/admin.mjs') && args.includes('admin@example.com')))
})
