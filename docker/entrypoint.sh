#!/bin/sh
set -eu

# Use the Compose database, independently of a localhost DATABASE_URL in .env.
# Encode credentials so passwords containing URL delimiters also work.
DATABASE_URL="$(node --input-type=module <<'JS'
const required = (name) => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return encodeURIComponent(value)
}
const user = required('POSTGRES_USER')
const password = required('POSTGRES_PASSWORD')
const database = required('POSTGRES_DB')
if (process.env.NUXT_SESSION_PASSWORD !== undefined && process.env.NUXT_SESSION_PASSWORD.length < 32) {
  throw new Error('NUXT_SESSION_PASSWORD must contain at least 32 characters')
}
process.stdout.write(`postgresql://${user}:${password}@postgres:5432/${database}`)
JS
)"
export DATABASE_URL

exec "$@"
