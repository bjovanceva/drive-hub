import { requireOrdinaryUser } from '../../../utils/authorization'
import { broadcastChatMessage } from '../../../utils/chatRealtime'

export default defineEventHandler(async (event) => {
  const user = await requireOrdinaryUser(event)

  const conversationId = Number(getRouterParam(event, 'id'))

  const body = await readBody<{
    content: string
  }>(event)

  if (!Number.isSafeInteger(conversationId) || conversationId <= 0) {
    throw createError({
      statusCode: 400
    })
  }

  const content = typeof body?.content === 'string' ? body.content.trim() : ''

  if (!content || content.length > 10000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Message must contain between 1 and 10000 characters'
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

  const message = await prisma.$transaction(async (tx) => {
    const saved = await tx.message.create({
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
    await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } })
    return saved
  })

  // A delivery failure must not turn a committed send into a retry/duplicate.
  try {
    await broadcastChatMessage(message)
  } catch (error) {
    console.error('Chat realtime delivery failed', error)
  }

  return message
})
