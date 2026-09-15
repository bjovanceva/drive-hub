<script setup lang="ts">
const { loggedIn } = useUserSession()
const route = useRoute()
const isChatPage = computed(() => route.path === '/messages' || route.path.startsWith('/messages/'))
</script>

<template>
  <NuxtLink v-if="loggedIn && !isChatPage" to="/messages" class="chat-launcher"
    aria-label="Open chats" title="Open chats">
    <span class="chat-launcher__label" aria-hidden="true">Open chats</span>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5a9.5 9.5 0 0 1 19 0Z" />
      <path d="M7 9h9M7 13h6" />
    </svg>
  </NuxtLink>
</template>

<style scoped>
.chat-launcher {
  position: fixed;
  right: calc(1.5rem + env(safe-area-inset-right, 0px));
  bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  display: grid;
  place-items: center;
  width: 3.75rem;
  height: 3.75rem;
  border: 1px solid #080a0d;
  border-radius: 50%;
  background: #c9f24d;
  color: #080a0d;
  text-decoration: none;
  box-shadow: 0 6px 20px #080a0d30;
  transition: transform 160ms ease, box-shadow 160ms ease;
}
.chat-launcher:hover { transform: translateY(-3px); box-shadow: 0 9px 24px #080a0d40; }
.chat-launcher:focus-visible { outline: 3px solid #080a0d; outline-offset: 4px; }
.chat-launcher__label {
  position: absolute;
  right: 0;
  bottom: calc(100% + .65rem);
  padding: .5rem .75rem;
  border-radius: .4rem;
  background: #080a0d;
  color: #fff;
  font-size: .8rem;
  font-weight: 600;
  white-space: nowrap;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}
.chat-launcher:hover .chat-launcher__label,
.chat-launcher:focus-visible .chat-launcher__label { visibility: visible; opacity: 1; }
@media (max-width: 48rem) {
  .chat-launcher { right: calc(1rem + env(safe-area-inset-right, 0px)); bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); width: 3.5rem; height: 3.5rem; }
}
@media (prefers-reduced-motion: reduce) {
  .chat-launcher { transition: none; }
  .chat-launcher:hover { transform: none; }
}
</style>
