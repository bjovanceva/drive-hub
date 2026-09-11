<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'Messages | Drive Hub' })
</script>

<template>
  <div class="messages-index">
    <ChatSidebar />
    <main class="messages-index__empty">
      <p>Drive Hub / Messages</p>
      <h1>Choose a conversation</h1>
      <span>Select a user in the sidebar to start writing.</span>
    </main>
  </div>
</template>

<style scoped>
.messages-index { display: flex; min-height: calc(100vh - 5rem); }
.messages-index__empty { display: flex; min-width: 0; flex: 1; flex-direction: column; justify-content: center; padding: 3rem; background: #fff; }
.messages-index__empty p { margin: 0; color: #667176; font-size: .75rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.messages-index__empty h1 { margin: .75rem 0; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(3rem, 7vw, 6rem); line-height: .85; text-transform: uppercase; }
.messages-index__empty span { color: #667176; }
@media (max-width: 48rem) { .messages-index { flex-direction: column; } .messages-index__empty { min-height: 20rem; padding: 2rem 1.25rem; } }
</style>