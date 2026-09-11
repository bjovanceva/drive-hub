<script setup lang="ts">
import { useChat } from '~/composables/useChat'
definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'Messages | Drive Hub' })
const route = useRoute()

const conversationId = computed(
  () => route.params.id as string
)

const text = ref('')
const sending = ref(false)
const sendError = ref('')

const {
  messages,
  loading,
  error,
  loadMessages,
  sendMessage
} = useChat(conversationId)

await loadMessages()

watch(conversationId, () => {
  text.value = ''
  sendError.value = ''
  void loadMessages()
})

async function submit() {
  const value = text.value.trim()

  if (!value || sending.value)
    return

  sending.value = true
  sendError.value = ''
  const targetId = conversationId.value
  try {
    await sendMessage(value)
    if (conversationId.value === targetId && text.value.trim() === value) text.value = ''
  } catch {
    if (conversationId.value === targetId) sendError.value = 'Unable to send your message. Please try again.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="chat-layout">
    <ChatSidebar :active-conversation-id="conversationId" />

    <section class="chat-thread">
      <div v-if="loading" class="chat-thread__loading">Loading...</div>
      <div v-else-if="error" class="chat-thread__loading" role="alert">
        {{ error }}
        <button type="button" @click="loadMessages">Retry</button>
      </div>

      <div v-else class="chat-thread__messages">
        <div v-for="message in messages" :key="message.id" class="chat-message">
          <strong>{{ message.sender.name }}</strong>
          <p>{{ message.content }}</p>
        </div>
        <p v-if="!messages.length" class="chat-thread__empty">No messages yet. Start the conversation below.</p>
      </div>

      <p v-if="sendError" role="alert">{{ sendError }}</p>
      <form class="chat-composer" @submit.prevent="submit">
        <input v-model="text" placeholder="Write a message..." aria-label="Message" >
        <button type="submit" :disabled="sending || loading || Boolean(error) || !text.trim()">{{ sending ? 'Sending...' : 'Send' }}</button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.chat-layout { display: flex; height: calc(100vh - 5rem); min-height: 34rem; }
.chat-thread { display: flex; min-width: 0; flex: 1; flex-direction: column; background: #fff; }
.chat-thread__loading, .chat-thread__empty { padding: 1.5rem; color: #687277; }
.chat-thread__messages { min-height: 0; flex: 1; overflow-y: auto; padding: 1.5rem; }
.chat-message { max-width: 42rem; margin-bottom: 1rem; padding: .85rem 1rem; border-left: 3px solid #c9f24d; background: #f4f5f1; }
.chat-message strong, .chat-message p { margin: 0; }
.chat-message strong { font-size: .78rem; }
.chat-message p { margin-top: .35rem; line-height: 1.45; white-space: pre-wrap; }
.chat-composer { display: flex; gap: .75rem; padding: 1rem 1.5rem; border-top: 1px solid #d9dde0; background: #fff; }
.chat-composer input { min-width: 0; flex: 1; padding: .8rem; border: 1px solid #080a0d; border-radius: 0; font: inherit; }
.chat-composer button { padding: .8rem 1.25rem; border: 1px solid #080a0d; border-radius: 0; background: #c9f24d; font-weight: 700; text-transform: uppercase; cursor: pointer; }
@media (max-width: 48rem) { .chat-layout { height: auto; min-height: calc(100vh - 5rem); flex-direction: column; } .chat-thread { min-height: 34rem; } }
</style>
