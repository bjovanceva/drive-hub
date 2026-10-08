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
const { user: currentUser } = useUserSession()

function conversationTitle(conversation: ConversationSummary) {
  if (conversation.type === 'GROUP') return conversation.name || 'Group conversation'
  return conversation.participants
    .filter(({ user }) => user.id !== currentUser.value?.id)
    .map(({ user }) => user.name)
    .join(', ') || 'Private conversation'
}

const { data: conversations, error: conversationsError, refresh } =
  await useFetch<ConversationSummary[]>('/api/conversations')
const { data: users, error: usersError } =
  await useFetch<ChatUser[]>('/api/users/selection')

watch([revision, lastMessage], () => { void refresh() })

const mode = ref<'PRIVATE' | 'GROUP'>('PRIVATE')
const selectedUserId = ref<number | null>(null)
const selectedUserIds = ref<number[]>([])
const groupName = ref('')
const userSearch = ref('')
const normalizeName = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()
const filteredUsers = computed(() => {
  const terms = normalizeName(userSearch.value).trim().split(/\s+/).filter(Boolean)
  return (users.value || []).filter(user => terms.every(term => normalizeName(user.name).includes(term)))
})
const selectedUsers = computed(() => (users.value || []).filter(user =>
  mode.value === 'PRIVATE' ? user.id === selectedUserId.value : selectedUserIds.value.includes(user.id)))
function removeSelectedUser(id: number) {
  if (mode.value === 'PRIVATE') selectedUserId.value = null
  else selectedUserIds.value = selectedUserIds.value.filter(userId => userId !== id)
}
const userDropdownOpen = ref(false)
const activeUserIndex = ref(-1)
const userOptions = ref<HTMLElement>()
function chooseUser(chatUser: ChatUser) {
  if (creating.value) return
  if (mode.value === 'PRIVATE') {
    selectedUserId.value = chatUser.id
    userDropdownOpen.value = false
    userSearch.value = ''
  } else if (selectedUserIds.value.includes(chatUser.id)) {
    removeSelectedUser(chatUser.id)
  } else {
    selectedUserIds.value.push(chatUser.id)
  }
}
async function moveUser(direction: number) {
  userDropdownOpen.value = true
  const count = filteredUsers.value.length
  if (!count) return
  activeUserIndex.value = (activeUserIndex.value + direction + count) % count
  await nextTick()
  userOptions.value?.children[activeUserIndex.value]?.scrollIntoView({ block: 'nearest' })
}
function selectActiveUser() {
  const target = filteredUsers.value[activeUserIndex.value]
  if (userDropdownOpen.value && target) chooseUser(target)
  else userDropdownOpen.value = true
}
watch(userSearch, () => { activeUserIndex.value = -1 })
watch(mode, () => { userSearch.value = ''; userDropdownOpen.value = false })
const creating = ref(false)
const createError = ref('')

const canStart = computed(() => {
  const hasUsers = selectedUserIds.value.length > 0
  return mode.value === 'PRIVATE'
    ? selectedUserId.value !== null
    : hasUsers && Boolean(groupName.value.trim())
})

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
    userSearch.value = ''
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

    <details class="chat-sidebar__new">
      <summary class="chat-sidebar__new-toggle">
        <h2>Start a private or group chat</h2>
        <span class="chat-sidebar__chevron" aria-hidden="true">⌄</span>
      </summary>
      <div class="chat-sidebar__mode" role="group" aria-label="Conversation type">
        <button type="button" :class="{ 'is-active': mode === 'PRIVATE' }" @click="mode = 'PRIVATE'">
          Private
        </button>
        <button type="button" :class="{ 'is-active': mode === 'GROUP' }" @click="mode = 'GROUP'">
          Group
        </button>
      </div>

      <form class="chat-sidebar__form" @submit.prevent="startConversation">
        <label for="chat-user-search">Choose user{{ mode === 'GROUP' ? 's' : '' }}</label>
        <div class="chat-sidebar__user-picker" @focusout="userDropdownOpen = false">
          <input id="chat-user-search" v-model="userSearch" type="text" role="combobox"
            aria-autocomplete="list" aria-controls="chat-user-options" :aria-expanded="userDropdownOpen"
            :aria-activedescendant="userDropdownOpen && activeUserIndex >= 0 ? `chat-user-option-${filteredUsers[activeUserIndex]?.id}` : undefined"
            :placeholder="mode === 'PRIVATE' && selectedUsers[0] ? selectedUsers[0].name : 'Select or type a name or surname'"
            autocomplete="off" :disabled="creating" @focus="userDropdownOpen = true" @click="userDropdownOpen = true"
            @input="userDropdownOpen = true" @keydown.down.prevent="moveUser(1)" @keydown.up.prevent="moveUser(-1)"
            @keydown.enter.prevent="selectActiveUser" @keydown.esc.prevent.stop="userDropdownOpen = false">
          <span class="chat-sidebar__picker-arrow" aria-hidden="true">&#9662;</span>
          <ul v-if="userDropdownOpen" id="chat-user-options" ref="userOptions" role="listbox"
            aria-label="Users" :aria-multiselectable="mode === 'GROUP'" class="chat-sidebar__user-results">
            <li v-for="(chatUser, index) in filteredUsers" :id="`chat-user-option-${chatUser.id}`" :key="chatUser.id"
              role="option" :aria-selected="mode === 'PRIVATE' ? selectedUserId === chatUser.id : selectedUserIds.includes(chatUser.id)"
              class="chat-sidebar__user-option" :class="{ 'is-highlighted': activeUserIndex === index }"
              @mousedown.prevent @click="chooseUser(chatUser)" @mouseenter="activeUserIndex = index">
              {{ chatUser.name }}
              <span v-if="mode === 'PRIVATE' ? selectedUserId === chatUser.id : selectedUserIds.includes(chatUser.id)" aria-hidden="true">&#10003;</span>
            </li>
            <li v-if="!filteredUsers.length" role="presentation" class="chat-sidebar__empty">No users found.</li>
          </ul>
        </div>
        <div v-if="selectedUsers.length" class="chat-sidebar__selected">
          <span>Selected:</span>
          <button v-for="chatUser in selectedUsers" :key="chatUser.id" type="button"
            :disabled="creating" :aria-label="`Remove ${chatUser.name}`" @click="removeSelectedUser(chatUser.id)">
            {{ chatUser.name }} <span aria-hidden="true">&times;</span>
          </button>
        </div>

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
    </details>

    <section class="chat-sidebar__conversations" aria-labelledby="your-chats-title">
      <div class="chat-sidebar__list-heading">
        <h2 id="your-chats-title">Your conversations</h2>
        <button type="button" title="Refresh conversations" @click="refresh()">Refresh</button>
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
.chat-sidebar__new, .chat-sidebar__conversations { flex-shrink: 0; padding: 1.25rem; }
.chat-sidebar__new { border-bottom: 1px solid #d9dde0; }
.chat-sidebar__new-toggle { display: flex; align-items: center; justify-content: space-between; gap: .75rem; cursor: pointer; list-style: none; }
.chat-sidebar__new-toggle::-webkit-details-marker { display: none; }
.chat-sidebar__new-toggle:focus-visible { outline: 2px solid #557900; outline-offset: 4px; }
.chat-sidebar__chevron { font-size: 1.4rem; line-height: 1; }
.chat-sidebar__new[open] .chat-sidebar__chevron { transform: rotate(180deg); }
.chat-sidebar__mode { display: grid; grid-template-columns: 1fr 1fr; margin: 1rem 0; }
.chat-sidebar button, .chat-sidebar select, .chat-sidebar input { min-height: 2.75rem; border: 1px solid #080a0d; border-radius: 0; font: inherit; }
.chat-sidebar button { padding: .6rem .75rem; background: #fff; font-size: .72rem; font-weight: 700; text-transform: uppercase; cursor: pointer; }
.chat-sidebar button.is-active, .chat-sidebar__form > button { background: #c9f24d; }
.chat-sidebar button:disabled { cursor: not-allowed; opacity: .5; }
.chat-sidebar__form { display: grid; gap: .65rem; }
.chat-sidebar__user-picker { position: relative; }
.chat-sidebar__user-picker > input { padding-right: 2rem; }
.chat-sidebar__picker-arrow { position: absolute; right: .75rem; top: .8rem; pointer-events: none; }
.chat-sidebar__user-results { position: absolute; z-index: 10; top: 100%; left: 0; right: 0; max-height: 14rem; overflow-y: auto; margin: 0; padding: .25rem; list-style: none; border: 1px solid #080a0d; background: #fff; box-shadow: 0 6px 16px #080a0d20; }
.chat-sidebar__user-option { display: flex; justify-content: space-between; gap: .5rem; padding: .65rem .5rem; font-size: .85rem; cursor: pointer; }
.chat-sidebar__user-option.is-highlighted { background: #f0f3e7; }
.chat-sidebar__user-option[aria-selected="true"] { font-weight: 700; background: #e9f6c5; }
.chat-sidebar__selected { display: flex; align-items: center; flex-wrap: wrap; gap: .4rem; max-height: 8rem; overflow-y: auto; padding: .2rem; font-size: .75rem; }
.chat-sidebar__selected button { min-height: 2rem; padding: .3rem .5rem; text-transform: none; }
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
