import { requireOrdinaryUser } from '../../../utils/authorization'

export default defineEventHandler(async (event) => {
  const user = await requireOrdinaryUser(event)

  const conversationId = Number(getRouterParam(event, 'id'))

  if (!Number.isSafeInteger(conversationId) || conversationId <= 0) {
    throw createError({
      statusCode: 400
    })
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: user.id
      }
    }
  })

  if (!participant) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not a participant of this conversation'
    })
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId
    },

    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],

    take: 50,

    include: {
      sender: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
  return messages.reverse()
})
