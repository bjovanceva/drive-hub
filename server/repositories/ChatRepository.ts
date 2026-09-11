import prisma from '../utils/prisma'
import { Prisma } from '../../app/generated/prisma/client'

const participantInclude = {
  participants: { include: { user: { select: { id: true, name: true } } } }
} as const

/** All persistence operations for conversations, participants and messages. */
export class ChatRepository {
  findConversations(userId: number) {
    return prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        ...participantInclude,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  findSelectableUsers(userId: number) {
    return prisma.user.findMany({
      where: { id: { not: userId } },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' }
    })
  }

  findUsers(userIds: number[]) {
    return prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true } })
  }

  findPrivateConversation(privateKey: string) {
    return prisma.conversation.findUnique({ where: { privateKey }, include: participantInclude })
  }

  async createPrivateConversation(privateKey: string, userIds: number[]) {
    try {
      return await prisma.conversation.create({
        data: { type: 'PRIVATE', privateKey, participants: { create: userIds.map(userId => ({ userId })) } },
        include: participantInclude
      })
    } catch (error) {
      // Resolve a concurrent create through the unique private key.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.findPrivateConversation(privateKey)
        if (existing) return existing
      }
      throw error
    }
  }

  createGroupConversation(name: string, userIds: number[]) {
    return prisma.conversation.create({
      data: { type: 'GROUP', name, participants: { create: userIds.map(userId => ({ userId })) } },
      include: participantInclude
    })
  }

  findParticipant(conversationId: number, userId: number) {
    return prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } }
    })
  }

  findRecentMessages(conversationId: number) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 50,
      include: { sender: { select: { id: true, name: true } } }
    })
  }

  createMessage(conversationId: number, senderId: number, content: string) {
    return prisma.$transaction(async tx => {
      const message = await tx.message.create({
        data: { conversationId, senderId, content },
        include: { sender: { select: { id: true, name: true } } }
      })
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } })
      return message
    })
  }

  findDeliveryParticipants(conversationId: number) {
    return prisma.conversationParticipant.findMany({
      where: { conversationId, user: { role: 'USER' } },
      select: { userId: true }
    })
  }
}
