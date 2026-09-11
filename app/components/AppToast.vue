<script setup lang="ts">
const props = withDefaults(defineProps<{
  message: string
  tone?: 'success' | 'error'
  duration?: number
}>(), {
  tone: 'success',
  duration: 0
})

const emit = defineEmits<{ close: [] }>()
let dismissTimer: ReturnType<typeof setTimeout> | undefined

function scheduleDismiss(message: string) {
  if (dismissTimer) clearTimeout(dismissTimer)
  if (!import.meta.client || !message) return
  const delay = props.duration || (props.tone === 'error' ? 8_000 : 5_000)
  dismissTimer = setTimeout(() => emit('close'), delay)
}

watch(() => [props.message, props.tone] as const, ([message]) => scheduleDismiss(message), { immediate: true })
onBeforeUnmount(() => { if (dismissTimer) clearTimeout(dismissTimer) })
</script>

<template>
  <Teleport to="body">
    <Transition name="dh-toast">
      <aside
        v-if="message"
        class="dh-toast"
        :class="`dh-toast--${tone}`"
        :role="tone === 'error' ? 'alert' : 'status'"
        :aria-live="tone === 'error' ? 'assertive' : 'polite'"
        aria-atomic="true"
      >
        <span class="dh-toast__mark" aria-hidden="true">{{ tone === 'error' ? '!' : '✓' }}</span>
        <div>
          <strong>{{ tone === 'error' ? 'Something went wrong' : 'Success' }}</strong>
          <p>{{ message }}</p>
        </div>
        <button type="button" aria-label="Dismiss notification" @click="emit('close')">×</button>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dh-toast {
  position: fixed;
  z-index: 2200;
  top: max(1.25rem, env(safe-area-inset-top));
  right: max(1.25rem, env(safe-area-inset-right));
  display: grid;
  width: min(27rem, calc(100vw - 2.5rem));
  min-height: 5rem;
  padding: 1rem;
  grid-template-columns: 2.5rem minmax(0, 1fr) 2.25rem;
  align-items: start;
  gap: .85rem;
  border: 1px solid var(--dh-color-border-strong);
  border-left: .4rem solid #6b9f20;
  background: #fff;
  box-shadow: .55rem .55rem 0 #10151030;
  color: var(--dh-color-text-primary);
}
.dh-toast--error { border-left-color: #c93827; }
.dh-toast__mark { display: grid; width: 2.5rem; height: 2.5rem; place-items: center; background: #e7f2d5; color: #31550b; font-weight: 900; }
.dh-toast--error .dh-toast__mark { background: #fff0ed; color: #9a291c; }
.dh-toast strong { display: block; margin: .05rem 0 .3rem; font-size: .75rem; letter-spacing: .045rem; text-transform: uppercase; }
.dh-toast p { margin: 0; font-size: .875rem; line-height: 1.45; }
.dh-toast button { display: grid; width: 2.25rem; height: 2.25rem; padding: 0; place-items: center; border: 0; background: transparent; color: var(--dh-color-text-secondary); font-size: 1.4rem; line-height: 1; cursor: pointer; }
.dh-toast button:hover { background: #f0f1ed; color: var(--dh-color-text-primary); }
.dh-toast button:focus-visible { outline: 2px solid var(--dh-color-text-primary); outline-offset: 2px; }
.dh-toast-enter-active, .dh-toast-leave-active { transition: opacity 160ms ease, transform 160ms ease; }
.dh-toast-enter-from, .dh-toast-leave-to { opacity: 0; transform: translateY(-.75rem); }
@media (max-width: 36rem) {
  .dh-toast { top: max(.75rem, env(safe-area-inset-top)); right: .75rem; width: calc(100vw - 1.5rem); }
}
@media (prefers-reduced-motion: reduce) {
  .dh-toast-enter-active, .dh-toast-leave-active { transition: none; }
}
</style>
