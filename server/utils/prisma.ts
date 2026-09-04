import { PrismaClient } from '../../app/generated/prisma/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const schema = connectionString
  ? (new URL(connectionString).searchParams.get('schema') ?? undefined)
  : undefined
const adapter = new PrismaPg({ connectionString }, { schema })
const prisma = new PrismaClient({ adapter })
export default prisma
