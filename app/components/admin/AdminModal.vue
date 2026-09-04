<script setup lang="ts">
const props = defineProps<{
  title: string
  eyebrow?: string
  busy?: boolean
  hideClose?: boolean
}>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
const titleId = useId()
let previousFocus: HTMLElement | null = null
function close() {
  if (!props.busy) emit('close')
}
onMounted(() => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  dialog.value?.showModal()
})
onBeforeUnmount(() => {
  dialog.value?.close()
  if (previousFocus?.isConnected) previousFocus.focus()
})
</script>

<template>
  <dialog ref="dialog" class="dh-admin-dialog" :aria-labelledby="titleId" @cancel.prevent="close">
    <header>
      <div>
        <p>{{ eyebrow || 'Administration' }}</p>
        <h2 :id="titleId">{{ title }}</h2>
      </div>
      <button
        v-if="!hideClose"
        type="button"
        class="dh-admin-icon"
        aria-label="Close editor"
        :disabled="busy"
        @click="close"
      >
        ×
      </button>
    </header>
    <slot />
  </dialog>
</template>
