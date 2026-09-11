import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import { ref, watch, toValue, nextTick, effectScope } from 'vue'

function source(path) {
  return stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8'))
    .replace(/^import .*$/gm, '')
    .replace(/export /g, '')
}

function chatService(repository, broadcast = async () => {}) {
  const Service = runInNewContext(`${source('../server/services/ChatService.ts')}; ChatService`, {
    ChatRepository: class { constructor() { return repository } },
    broadcastChatMessage: broadcast,
    createError: details => Object.assign(new Error(details.statusMessage), details),
    console: { error() {} }
  })
  return new Service()
}

test('chat service rejects nonparticipants before reading or writing messages', async () => {
  const service = chatService({
    findParticipant: async () => null,
    findRecentMessages: async () => assert.fail('Must not read messages'),
    createMessage: async () => assert.fail('Must not write messages')
  })
  await assert.rejects(service.listMessages(1, '12'), { statusCode: 403 })
  await assert.rejects(service.sendMessage(1, '12', { content: 'Hello' }), { statusCode: 403 })
  await assert.rejects(service.listMessages(1, 'invalid'), { statusCode: 400 })
  await assert.rejects(service.sendMessage(1, '12', { content: '  ' }), { statusCode: 400 })
})

test('chat service saves trimmed content before broadcasting and preserves success on delivery failure', async () => {
  const order = []
  const saved = { id: 7, conversationId: 12, content: 'Hello' }
  const service = chatService({
    findParticipant: async () => ({ userId: 1 }),
    createMessage: async (conversationId, senderId, content) => {
      assert.equal(conversationId, 12)
      assert.equal(senderId, 1)
      assert.equal(content, 'Hello')
      order.push('save')
      return saved
    },
    findRecentMessages: async () => [{ id: 2 }, { id: 1 }]
  }, async message => {
    assert.equal(message, saved)
    order.push('broadcast')
    throw new Error('Delivery unavailable')
  })
  assert.equal(await service.sendMessage(1, '12', { content: ' Hello ' }), saved)
  assert.deepEqual(order, ['save', 'broadcast'])
  assert.deepEqual(await service.listMessages(1, '12'), [{ id: 1 }, { id: 2 }])
})

test('chat service deduplicates participants and reuses the existing private key format', async () => {
  const existing = { id: 12 }
  const service = chatService({
    findUsers: async ids => {
      assert.deepEqual(Array.from(ids), [2])
      return [{ id: 2 }]
    },
    findPrivateConversation: async key => {
      assert.equal(key, '10:2')
      return existing
    },
    createPrivateConversation: async () => assert.fail('Must reuse existing private chat'),
    createGroupConversation: async (name, ids) => {
      assert.equal(name, 'School')
      assert.deepEqual(Array.from(ids), [10, 2])
      return { id: 13 }
    }
  })
  assert.equal(await service.createConversation(10, { type: 'PRIVATE', userIds: [10, 2, 2] }), existing)
  assert.equal((await service.createConversation(10, { type: 'GROUP', name: ' School ', userIds: [2, 2] })).id, 13)
  await assert.rejects(service.createConversation(10, { type: 'PRIVATE', userIds: [] }), { statusCode: 400 })
  await assert.rejects(service.createConversation(10, null), { statusCode: 400 })
})

test('broadcast is limited to current participants and valid sessions; failed peers do not stop delivery', async () => {
  let participants = [1, 2, 3, 4]
  const api = runInNewContext(`${source('../server/utils/chatRealtime.ts')}
    ;({ registerChatPeer, unregisterChatPeer, broadcastChatMessage })`, {
    ChatRepository: class {
      async findDeliveryParticipants(conversationId) {
        assert.equal(conversationId, 12)
        return participants.map(userId => ({ userId }))
      }
    },
    requireUserSession: async ({ request }) => {
      if (request.expired) throw new Error('Expired')
      return { user: { id: request.userId } }
    }
  })
  const peer = (userId, options = {}) => ({
    request: { userId, ...options }, received: [], closed: null,
    send(payload) { if (options.broken) throw new Error('Disconnected'); this.received.push(JSON.parse(payload)) },
    close(code) { this.closed = code }
  })
  const alice = peer(1), bob = peer(2), outsider = peer(9)
  const expired = peer(3, { expired: true }), broken = peer(4, { broken: true })
  for (const item of [broken, expired, alice, bob, outsider]) api.registerChatPeer(item, item.request.userId)
  await api.broadcastChatMessage({ id: 7, conversationId: 12, content: 'Hello' })
  assert.equal(alice.received.length, 1)
  assert.equal(bob.received[0].message.content, 'Hello')
  assert.equal(outsider.received.length, 0)
  assert.equal(expired.closed, 1008)
  assert.equal(broken.closed, 1011)
  participants = [1]
  await api.broadcastChatMessage({ id: 8, conversationId: 12 })
  assert.equal(bob.received.length, 1)
  api.unregisterChatPeer(alice)
  await api.broadcastChatMessage({ id: 9, conversationId: 12 })
  assert.equal(alice.received.length, 2)
})

test('history, socket events and POST responses merge without duplicates or cross-conversation messages', async () => {
  const lastMessage = ref(null), revision = ref(0), conversation = ref('12')
  const pending = []
  const message = { id: 7, conversationId: 12, senderId: 1, content: 'Hello', createdAt: '2026-09-11T12:00:00Z', sender: { id: 1, name: 'Alice' } }
  const useChat = runInNewContext(`${source('../app/composables/useChat.ts')}; useChat`, {
    ref, watch, toValue,
    useChatRealtime: () => ({ lastMessage, revision }),
    useRequestFetch: () => () => new Promise(resolve => pending.push(resolve)),
    $fetch: async () => message
  })
  const scope = effectScope()
  const chat = scope.run(() => useChat(conversation))
  try {
    const loading = chat.loadMessages()
    lastMessage.value = message
    await nextTick()
    pending.shift()([message])
    await loading
    await chat.sendMessage('Hello')
    assert.equal(chat.messages.value.length, 1)
    lastMessage.value = { ...message, id: 8, conversationId: 99 }
    await nextTick()
    assert.equal(chat.messages.value.length, 1)
    const stale = chat.loadMessages()
    conversation.value = '13'
    const current = chat.loadMessages()
    pending.shift()([message])
    pending.shift()([])
    await Promise.all([stale, current])
    assert.equal(chat.messages.value.length, 0)
    revision.value++
    await nextTick()
    assert.equal(pending.length, 1, 'reconnect reloads history')
    pending.shift()([])
    await nextTick()
  } finally {
    scope.stop()
  }
})
