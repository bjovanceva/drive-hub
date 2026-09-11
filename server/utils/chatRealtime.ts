import type { Peer } from 'crossws'
import prisma from './prisma'

// One Nitro process. Multiple instances need a shared pub/sub transport.
const connections = new Map<Peer, number>()

export async function requireChatSession(peer: Peer) {
  // Fresh context forces the sealed cookie's expiry to be checked again.
  return requireUserSession({ context: {}, request: peer.request })
}

export function registerChatPeer(peer: Peer, userId: number) {
  connections.set(peer, userId)
}

export function unregisterChatPeer(peer: Peer) {
  connections.delete(peer)
}

export async function broadcastChatMessage(message: { id: number; conversationId: number }) {
  // Resolve membership at delivery time rather than trusting a client room name.
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId: message.conversationId, user: { role: 'USER' } },
    select: { userId: true }
  })
  const recipients = new Set(participants.map(participant => participant.userId))
  const payload = JSON.stringify({ type: 'message.created', message })
  for (const [peer, userId] of connections) {
    if (!recipients.has(userId)) continue
    try {
      const session = await requireChatSession(peer)
      if (session.user.id !== userId) throw new Error('Session identity changed')
    } catch {
      connections.delete(peer)
      peer.close(1008, 'Authentication required')
      continue
    }
    try {
      peer.send(payload)
    } catch {
      connections.delete(peer)
      peer.close(1011, 'Delivery failed')
    }
  }
}
