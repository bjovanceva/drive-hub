import { requireOrdinaryUser } from '../../utils/authorization'

export default defineEventHandler(async (event) => {
  const user = await requireOrdinaryUser(event)

  return prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId: user.id
        }
      }
    },

    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },

      messages: {
        orderBy: {
          createdAt: 'desc'
        },

        take: 1
      }
    },

    orderBy: {
      updatedAt: 'desc'
    }
  })
})