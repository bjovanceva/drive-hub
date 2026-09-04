import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { z } from 'zod'

export const adminAccountSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2).max(80).optional(),
  newEmail: z.string().trim().toLowerCase().email().optional(),
  // Match the login input bounds without imposing password-strength rules.
  password: z.string().min(1, 'Password is required').max(128)
}).strict()

/** Only identity fields are written. Existing ordinary users cannot be promoted. */
export async function saveAdministrator(client, mode, input) {
  if (!['create', 'update'].includes(mode)) throw new Error('Choose create or update.')
  const account = adminAccountSchema.parse(input)
  if (mode === 'create' && !account.name) throw new Error('--name is required when creating an administrator.')
  if (mode === 'create' && account.newEmail) throw new Error('--new-email is only supported with update.')
  const passwordHash = await new Hash(new Scrypt()).make(account.password)

  await client.query('BEGIN')
  try {
    const existing = await client.query('SELECT id, role FROM "User" WHERE email = $1 FOR UPDATE', [account.email])
    const user = existing.rows[0]
    if (user && user.role !== 'ADMIN') throw new Error('This email belongs to an ordinary user. No changes were made.')
    if (mode === 'create' && user) throw new Error('Administrator already exists. Use update instead.')
    if (mode === 'update' && !user) throw new Error('Administrator not found. Use create instead.')

    const result = mode === 'create'
      ? await client.query(
        'INSERT INTO "User" (name, email, password, role) VALUES ($1, $2, $3, \'ADMIN\') RETURNING id, name, email, role',
        [account.name, account.email, passwordHash]
      )
      : await client.query(
        'UPDATE "User" SET name = COALESCE($1, name), email = $2, password = $3 WHERE id = $4 AND role = \'ADMIN\' RETURNING id, name, email, role',
        [account.name ?? null, account.newEmail ?? account.email, passwordHash, user.id]
      )
    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23505') throw new Error('That email is already in use. No changes were made.')
    throw error
  }
}
