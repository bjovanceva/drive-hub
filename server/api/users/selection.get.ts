import prisma from '../../utils/prisma'
import { requireOrdinaryUser } from '../../utils/authorization'

export default defineEventHandler(async (event) => {
  const currentUser = await requireOrdinaryUser(event)

  return prisma.user.findMany({
    where: {
      id: { not: currentUser.id }
    },
    select: {
      id: true,
      name: true,
      role: true
    },
    orderBy: {
      name: 'asc'
    }
  })
})