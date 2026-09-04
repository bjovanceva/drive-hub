import { parseArgs } from 'node:util'
import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'
import pg from 'pg'
import { saveAdministrator } from './admin-accounts.mjs'

const help = `Manage Drive Hub administrator credentials.

  npm run admin:create -- --email admin@example.com --name "Administrator"
  npm run admin:update -- --email admin@example.com [--new-email new@example.com] [--name "New name"]

Both commands prompt for a new password and confirmation with hidden input.
For non-interactive use, supply DRIVE_HUB_ADMIN_PASSWORD through the environment.
DATABASE_URL is read from the environment or .env. Existing USER accounts are never changed.
Update preserves the administrator's ID and replaces their password.`

async function hiddenPassword(prompt) {
  if (!process.stdin.isTTY) throw new Error('Use an interactive terminal or set DRIVE_HUB_ADMIN_PASSWORD.')
  const mutedOutput = new Writable({ write(_chunk, _encoding, callback) { callback() } })
  const readline = createInterface({ input: process.stdin, output: mutedOutput, terminal: true })
  process.stdout.write(prompt)
  try {
    return await new Promise((resolve, reject) => {
      readline.once('SIGINT', () => reject(new Error('Cancelled.')))
      readline.once('close', () => reject(new Error('Password input closed.')))
      readline.question('', resolve)
    })
  } finally {
    readline.close()
    process.stdout.write('\n')
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      email: { type: 'string' },
      name: { type: 'string' },
      'new-email': { type: 'string' },
      help: { type: 'boolean', short: 'h' }
    }
  })
  if (values.help) { console.log(help); return }
  const [mode] = positionals
  if (positionals.length !== 1 || !['create', 'update'].includes(mode)) throw new Error(help)
  if (!values.email) throw new Error('--email is required.')
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in the environment or .env.')

  const password = process.env.DRIVE_HUB_ADMIN_PASSWORD ?? await hiddenPassword('New admin password: ')
  if (!process.env.DRIVE_HUB_ADMIN_PASSWORD && password !== await hiddenPassword('Confirm password: ')) {
    throw new Error('Passwords do not match. No changes were made.')
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()
    const user = await saveAdministrator(client, mode, {
      email: values.email,
      name: values.name,
      newEmail: values['new-email'],
      password
    })
    console.log(`Administrator ${mode === 'create' ? 'created' : 'updated'}: ${user.email} (ID ${user.id}).`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  // Do not dump database configuration, query parameters, or password values.
  console.error(error.issues
    ? error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n')
    : error.code ? `Database operation failed (${error.code}).` : error.message)
  process.exitCode = 1
})
