<script setup lang="ts">
interface ConversationSummary {
  id: number
  type: 'PRIVATE' | 'GROUP'
  name: string | null
  participants: Array<{ user: { id: number; name: string } }>
  messages: Array<{ content: string; createdAt: string }>
}

interface ChatUser {
  id: number
  name: string
}

const props = defineProps<{
  activeConversationId?: string
}>()
const { status: realtimeStatus, revision, lastMessage } = useChatRealtime()

const { data: conversations, error: conversationsError, refresh } =
  await useFetch<ConversationSummary[]>('/api/conversations')
const { data: users, error: usersError } =
  await useFetch<ChatUser[]>('/api/users/selection')

watch([revision, lastMessage], () => { void refresh() })

const mode = ref<'PRIVATE' | 'GROUP'>('PRIVATE')
const selectedUserId = ref<number | null>(null)
const selectedUserIds = ref<number[]>([])
const groupName = ref('')
const creating = ref(false)
const createError = ref('')

const canStart = computed(() => {
  const hasUsers = selectedUserIds.value.length > 0
  return mode.value === 'PRIVATE'
    ? selectedUserId.value !== null
    : hasUsers && Boolean(groupName.value.trim())
})

function conversationTitle(conversation: ConversationSummary) {
  if (conversation.type === 'GROUP') return conversation.name || 'Group conversation'
  return conversation.participants.map(({ user }) => user.name).join(', ')
}

async function startConversation() {
  if (!canStart.value) return

  creating.value = true
  createError.value = ''

  try {
    const conversation = await $fetch<ConversationSummary>('/api/conversations', {
      method: 'POST',
      body: {
        type: mode.value,
        userIds: mode.value === 'PRIVATE' ? [selectedUserId.value] : selectedUserIds.value,
        name: mode.value === 'GROUP' ? groupName.value : undefined
      }
    })

    selectedUserIds.value = []
    selectedUserId.value = null
    groupName.value = ''
    await refresh()
    await navigateTo(`/messages/${conversation.id}`)
  } catch (error: any) {
    createError.value = error?.data?.statusMessage || 'Unable to start the conversation.'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <aside class="chat-sidebar">
    <div class="chat-sidebar__heading">
      <p class="chat-sidebar__eyebrow">Drive Hub</p>
      <h1>Chats</h1>
      <p role="status">{{ realtimeStatus === 'connected' ? 'Live' : realtimeStatus === 'connecting' ? 'Connecting...' : 'Offline — reconnecting when available' }}</p>
    </div>

    <section class="chat-sidebar__new" aria-labelledby="new-chat-title">
      <h2 id="new-chat-title">Start a conversation</h2>
      <div class="chat-sidebar__mode" role="group" aria-label="Conversation type">
        <button type="button" :class="{ 'is-active': mode === 'PRIVATE' }" @click="mode = 'PRIVATE'">
          Private
        </button>
        <button type="button" :class="{ 'is-active': mode === 'GROUP' }" @click="mode = 'GROUP'">
          Group
        </button>
      </div>

      <form class="chat-sidebar__form" @submit.prevent="startConversation">
        <label for="chat-users">Choose user{{ mode === 'GROUP' ? 's' : '' }}</label>
        <select
          v-if="mode === 'PRIVATE'"
          id="chat-users"
          v-model="selectedUserId"
          :disabled="creating || !users?.length"
        >
          <option :value="null" disabled>Select a user</option>
          <option v-for="chatUser in users" :key="chatUser.id" :value="chatUser.id">
            {{ chatUser.name }}
          </option>
        </select>
        <select
          v-else
          id="chat-users"
          v-model="selectedUserIds"
          multiple
          :size="5"
          :disabled="creating || !users?.length"
        >
          <option v-for="chatUser in users" :key="chatUser.id" :value="chatUser.id">
            {{ chatUser.name }}
          </option>
        </select>

        <input
          v-if="mode === 'GROUP'"
          v-model="groupName"
          type="text"
          placeholder="Group name"
          maxlength="100"
        >

        <button type="submit" :disabled="!canStart || creating">
          {{ creating ? 'Opening...' : 'Open chat' }}
        </button>
      </form>
      <p v-if="usersError" class="chat-sidebar__error">Users could not be loaded.</p>
      <p v-if="createError" class="chat-sidebar__error">{{ createError }}</p>
    </section>

    <section class="chat-sidebar__conversations" aria-labelledby="your-chats-title">
      <div class="chat-sidebar__list-heading">
        <h2 id="your-chats-title">Your conversations</h2>
        <button type="button" title="Refresh conversations" @click="refresh">Refresh</button>
      </div>
      <p v-if="conversationsError" class="chat-sidebar__empty">Conversations could not be loaded.</p>
      <p v-else-if="!conversations?.length" class="chat-sidebar__empty">No conversations yet.</p>
      <nav v-else aria-label="Your conversations">
        <NuxtLink
          v-for="conversation in conversations"
          :key="conversation.id"
          :to="`/messages/${conversation.id}`"
          class="chat-sidebar__conversation"
          :class="{ 'is-active': String(conversation.id) === props.activeConversationId }"
        >
          <strong>{{ conversationTitle(conversation) }}</strong>
          <small>{{ conversation.messages[0]?.content || 'No messages yet' }}</small>
        </NuxtLink>
      </nav>
    </section>
  </aside>
</template>

<style scoped>
.chat-sidebar { display: flex; width: 22rem; flex: 0 0 22rem; flex-direction: column; overflow-y: auto; border-right: 1px solid #d9dde0; background: #f4f5f1; color: #080a0d; }
.chat-sidebar__heading { padding: 1.5rem; border-bottom: 1px solid #d9dde0; background: #080a0d; color: #fff; }
.chat-sidebar__eyebrow { margin: 0; color: #c9f24d; font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.chat-sidebar h1, .chat-sidebar h2, .chat-sidebar p { margin: 0; }
.chat-sidebar h1 { margin-top: .35rem; font-family: 'Barlow Condensed', sans-serif; font-size: 3rem; line-height: .9; text-transform: uppercase; }
.chat-sidebar h2 { font-family: 'Barlow Condensed', sans-serif; font-size: 1.35rem; line-height: 1; text-transform: uppercase; }
.chat-sidebar__new, .chat-sidebar__conversations { padding: 1.25rem; }
.chat-sidebar__new { border-bottom: 1px solid #d9dde0; }
.chat-sidebar__mode { display: grid; grid-template-columns: 1fr 1fr; margin: 1rem 0; }
.chat-sidebar button, .chat-sidebar select, .chat-sidebar input { min-height: 2.75rem; border: 1px solid #080a0d; border-radius: 0; font: inherit; }
.chat-sidebar button { padding: .6rem .75rem; background: #fff; font-size: .72rem; font-weight: 700; text-transform: uppercase; cursor: pointer; }
.chat-sidebar button.is-active, .chat-sidebar__form > button { background: #c9f24d; }
.chat-sidebar button:disabled { cursor: not-allowed; opacity: .5; }
.chat-sidebar__form { display: grid; gap: .65rem; }
.chat-sidebar__form label { font-size: .7rem; font-weight: 700; text-transform: uppercase; }
.chat-sidebar select, .chat-sidebar input { width: 100%; padding: .65rem; background: #fff; }
.chat-sidebar select[multiple] { height: auto; }
.chat-sidebar__error { margin-top: .7rem !important; color: #a32626; font-size: .78rem; }
.chat-sidebar__list-heading { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-bottom: .75rem; }
.chat-sidebar__list-heading button { min-height: auto; padding: 0; border: 0; background: transparent; font-size: .65rem; }
.chat-sidebar__empty { color: #5f686e; font-size: .82rem; }
.chat-sidebar__conversation { display: block; padding: .85rem .75rem; border-top: 1px solid #d9dde0; color: inherit; text-decoration: none; }
.chat-sidebar__conversation:hover, .chat-sidebar__conversation.is-active { background: #fff; }
.chat-sidebar__conversation strong, .chat-sidebar__conversation small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat-sidebar__conversation small { margin-top: .3rem; color: #687277; font-size: .75rem; }
@media (max-width: 48rem) { .chat-sidebar { width: 100%; flex-basis: auto; max-height: 42vh; border-right: 0; border-bottom: 1px solid #d9dde0; } }
</style>
