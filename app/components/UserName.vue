<script setup lang="ts">
const props = defineProps<{ userId?: number | null; name?: string | null }>()
const { user } = useUserSession()
const route = useRoute()
const isChatPage = computed(() => route.path === '/messages' || route.path.startsWith('/messages/'))
const trigger = ref<HTMLSpanElement>()
const card = ref<HTMLElement>()
const open = ref(false)
const busy = ref(false)
const error = ref('')
const contact = ref<{ id: number; email: string; phone: string | null } | null>(null)
const contactLoading = ref(false)
const contactError = ref('')
let contactRequest = 0
async function loadContact() {
  const targetId = props.userId
  if (!targetId) return
  const request = ++contactRequest
  contact.value = null
  contactLoading.value = true
  contactError.value = ''
  try {
    const result = await $fetch<{ id: number; email: string; phone: string | null }>(`/api/users/${targetId}/contact`)
    if (request === contactRequest && targetId === props.userId) contact.value = result
  } catch {
    if (request === contactRequest) contactError.value = 'Unable to load contact details.'
  } finally {
    if (request === contactRequest) contactLoading.value = false
  }
}
const position = ref({ left: '0px', top: '0px' })
const id = useId()
const isSelf = computed(() => props.userId === user.value?.id)

function close() {
  card.value?.hidePopover()
  open.value = false
}
watch([isChatPage, isSelf], close)
function show() {
  if (isChatPage.value || isSelf.value || !props.userId || !trigger.value || !card.value) return
  const rect = trigger.value.getBoundingClientRect()
  position.value = {
    left: `${Math.max(8, Math.min(rect.left, window.innerWidth - 288))}px`,
    top: `${Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 320))}px`
  }
  card.value.showPopover()
  open.value = true
  void loadContact()
  card.value.querySelector('button')?.focus()
}
async function sendMessage() {
  if (busy.value || !props.userId || isSelf.value) return
  busy.value = true
  error.value = ''
  try {
    const conversation = await $fetch<{ id: number }>('/api/conversations', {
      method: 'POST', body: { type: 'PRIVATE', userIds: [props.userId] }
    })
    await refreshNuxtData('/api/conversations')
    close()
    await navigateTo(`/messages/${conversation.id}`)
  } catch {
    error.value = 'Unable to open chat. Please try again.'
  } finally {
    busy.value = false
  }
}
onBeforeUnmount(close)
</script>

<template>
  <span v-if="!userId || isChatPage || isSelf">{{ name }}</span>
  <span v-else class="user-name">
    <span ref="trigger" class="user-name__trigger" role="button" tabindex="0"
      aria-haspopup="dialog" :aria-expanded="open" :aria-controls="id"
      @click.stop.prevent="show" @keydown.enter.stop.prevent="show"
      @keydown.space.stop.prevent="show" @keydown.esc.stop.prevent="close"
      @keydown.down.prevent="card?.querySelector('button')?.focus()">
      {{ name }}
    </span>
    <ClientOnly>
    <Teleport to="body">
    <span :id="id" ref="card" popover="auto" role="dialog" :aria-label="name || 'User'"
      class="user-name__card" :style="position"
      @toggle="open = ($event as ToggleEvent).newState === 'open'"
      @click.stop @keydown.esc.stop.prevent="close">
      <span class="user-name__title">{{ name }}</span>
      <button class="user-name__close" type="button" aria-label="Close user popup" @click="close(); trigger?.focus()">&times;</button>
      <span v-if="contactLoading" class="user-name__contact" role="status">Loading contact details...</span>
      <span v-else-if="contactError" class="user-name__contact" role="alert">
        {{ contactError }} <button type="button" @click="loadContact">Retry</button>
      </span>
      <span v-else-if="contact" class="user-name__contact">
        <span class="user-name__contact-label">Email</span>
        <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
        <span class="user-name__contact-label">Phone</span>
        <a v-if="contact.phone" :href="`tel:${contact.phone.replace(/[^+0-9]/g, '')}`">{{ contact.phone }}</a>
        <span v-else>Not provided</span>
      </span>
      <button type="button" :disabled="busy || isSelf" @click="sendMessage">
        {{ busy ? 'Opening chat…' : 'Send message' }}
      </button>
      <span v-if="error" class="user-name__error" role="alert">{{ error }}</span>
    </span>
    </Teleport>
    </ClientOnly>
  </span>
</template>

<style scoped>
.user-name__trigger { cursor: pointer; text-decoration: underline dotted; text-underline-offset: .2em; }
.user-name__trigger:focus-visible { outline: 2px solid #557900; outline-offset: 3px; }
.user-name__card { position: fixed; inset: auto; margin: 0; box-sizing: border-box; width: 280px; max-width: calc(100vw - 16px); padding: 1rem; border: 1px solid #d9dde0; border-radius: 8px; background: #fff; color: #080a0d; box-shadow: 0 12px 36px #080a0d30; font: 400 14px/1.4 sans-serif; text-transform: none; letter-spacing: normal; white-space: normal; }
.user-name__title { display: block; margin-bottom: .75rem; padding-right: 2rem; font-weight: 700; overflow-wrap: anywhere; }
.user-name__card button { display: block; width: 100%; padding: .65rem .8rem; border: 1px solid #080a0d; border-radius: 4px; background: #c9f24d; color: #080a0d; font: 700 14px/1.4 sans-serif; cursor: pointer; }
.user-name__card button:disabled { opacity: .55; cursor: default; }
.user-name__card .user-name__close { position: absolute; top: .5rem; right: .5rem; width: 2rem; height: 2rem; padding: 0; border: 0; background: transparent; font-size: 1.4rem; }
.user-name__error { display: block; margin-top: .5rem; }
.user-name__error { color: #a32626; }
.user-name__contact { display: block; margin-bottom: 1rem; overflow-wrap: anywhere; }
.user-name__contact-label { display: block; margin-top: .5rem; color: #667176; font-size: .75rem; }
.user-name__contact a { color: #304b08; text-underline-offset: .15em; }
.user-name__card { max-height: calc(100dvh - 16px); overflow-y: auto; }
</style>
