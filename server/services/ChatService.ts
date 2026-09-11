import { ChatRepository } from '../repositories/ChatRepository'
import { broadcastChatMessage } from '../utils/chatRealtime'

/** Chat validation, membership rules and message delivery orchestration. */
export class ChatService {
  private repository = new ChatRepository()

  listConversations(userId: number) {
    return this.repository.findConversations(userId)
  }

  listUsers(userId: number) {
    return this.repository.findSelectableUsers(userId)
  }

  async createConversation(userId: number, input: unknown) {
    const body = input as { type?: unknown; userIds?: unknown; name?: unknown } | null
    if (!body || (body.type !== 'PRIVATE' && body.type !== 'GROUP')) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid conversation type' })
    }
    if (!Array.isArray(body.userIds) || body.userIds.some(id => !Number.isSafeInteger(id) || id <= 0)) {
      throw createError({ statusCode: 400, statusMessage: 'userIds must be an array of positive integer IDs' })
    }
    const otherUserIds = [...new Set<number>(body.userIds)].filter(id => id !== userId)
    if (body.type === 'PRIVATE' && otherUserIds.length !== 1) {
      throw createError({ statusCode: 400, statusMessage: 'A private conversation must contain exactly one other user' })
    }
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (body.type === 'GROUP') {
      if (!name) throw createError({ statusCode: 400, statusMessage: 'Group name is required' })
      if (!otherUserIds.length) {
        throw createError({ statusCode: 400, statusMessage: 'A group conversation must contain at least one other user' })
      }
    }
    const users = await this.repository.findUsers(otherUserIds)
    if (users.length !== otherUserIds.length) {
      throw createError({ statusCode: 404, statusMessage: 'One or more users were not found' })
    }
    const participantIds = [userId, ...otherUserIds]
    if (body.type === 'PRIVATE') {
      // Keep the existing key format so previously created chats are reused.
      const privateKey = [...participantIds].sort().join(':')
      const existing = await this.repository.findPrivateConversation(privateKey)
      return existing ?? this.repository.createPrivateConversation(privateKey, participantIds)
    }
    return this.repository.createGroupConversation(name, participantIds)
  }

  private conversationId(value: unknown) {
    const id = Number(value)
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid conversation ID' })
    }
    return id
  }

  private async requireParticipant(conversationId: number, userId: number) {
    if (!await this.repository.findParticipant(conversationId, userId)) {
      throw createError({ statusCode: 403, statusMessage: 'You are not a participant of this conversation' })
    }
  }

  async listMessages(userId: number, id: unknown) {
    const conversationId = this.conversationId(id)
    await this.requireParticipant(conversationId, userId)
    const messages = await this.repository.findRecentMessages(conversationId)
    return messages.reverse()
  }

  async sendMessage(userId: number, id: unknown, input: unknown) {
    const conversationId = this.conversationId(id)
    const body = input as { content?: unknown } | null
    const content = typeof body?.content === 'string' ? body.content.trim() : ''
    if (!content || content.length > 10000) {
      throw createError({ statusCode: 400, statusMessage: 'Message must contain between 1 and 10000 characters' })
    }
    await this.requireParticipant(conversationId, userId)
    const message = await this.repository.createMessage(conversationId, userId, content)
    // Persistence succeeded: delivery failures must not cause duplicate retries.
    try {
      await broadcastChatMessage(message)
    } catch (error) {
      console.error('Chat realtime delivery failed', error)
    }
    return message
  }
}
