import { AuthService } from '../../services/AuthService'
import { registerChatPeer, unregisterChatPeer, requireChatSession } from '../../utils/chatRealtime'

export default defineWebSocketHandler({
  async upgrade(request) {
    const origin = request.headers.get('origin')
    if (!origin || origin !== new URL(request.url).origin) {
      throw new Response('Invalid origin', { status: 403 })
    }
    try {
      const { user } = await requireUserSession(request)
      await new AuthService().getOrdinaryUser(user.id)
    } catch {
      throw new Response('Authentication required', { status: 401 })
    }
  },
  async open(peer) {
    try {
      const { user } = await requireChatSession(peer)
      await new AuthService().getOrdinaryUser(user.id)
      registerChatPeer(peer, user.id)
      peer.send(JSON.stringify({ type: 'ready' }))
    } catch {
      peer.close(1008, 'Authentication required')
    }
  },
  async message(peer, message) {
    // Clients send only heartbeats; all message writes use the guarded HTTP API.
    try {
      if (message.text() !== 'ping') return
      const { user } = await requireChatSession(peer)
      await new AuthService().getOrdinaryUser(user.id)
      peer.send(JSON.stringify({ type: 'pong' }))
    } catch {
      unregisterChatPeer(peer)
      peer.close(1008, 'Authentication required')
    }
  },
  close(peer) {
    unregisterChatPeer(peer)
  },
  error(peer) {
    unregisterChatPeer(peer)
  }
})
