import { requireOrdinaryUser } from '../../../utils/authorization'

export default defineEventHandler(async (event) => {
  const user = await requireOrdinaryUser(event)

  const conversationId = Number(getRouterParam(event, 'id'))

  const body = await readBody<{
    content: string
  }>(event)

  if (!conversationId) {
    throw createError({
      statusCode: 400
    })
  }

  const content = body.content?.trim()

  if (!content) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Message cannot be empty'
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
      statusMessage: 'You are not a participant'
    })
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: user.id,
      content
    },

    include: {
      sender: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return message
})
