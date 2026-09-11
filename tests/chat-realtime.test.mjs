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

test('broadcast is limited to current participants and valid sessions; failed peers do not stop delivery', async () => {
  let participants = [1, 2, 3, 4]
  const api = runInNewContext(`${source('../server/utils/chatRealtime.ts')}
    ;({ registerChatPeer, unregisterChatPeer, broadcastChatMessage })`, {
    prisma: { conversationParticipant: { findMany: async ({ where }) => {
      assert.equal(where.conversationId, 12)
      assert.equal(where.user.role, 'USER')
      return participants.map(userId => ({ userId }))
    } } },
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
