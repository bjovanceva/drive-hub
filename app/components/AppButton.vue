<script lang="ts" setup>
type ButtonVariant = 'primary' | 'secondary'

withDefaults(defineProps<{
  text: string
  variant?: ButtonVariant
  to?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}>(), {
  variant: 'primary',
  to: undefined,
  type: 'button',
  disabled: false
})
</script>

<template>
  <NuxtLink
    v-if="to"
    class="dh-button"
    :class="`dh-button--${variant}`"
    :to="to"
  >
    {{ text }}
  </NuxtLink>

  <button
    v-else
    class="dh-button"
    :class="`dh-button--${variant}`"
    :type="type"
    :disabled="disabled"
  >
    {{ text }}
  </button>
</template>

<style scoped>
.dh-button {
  display: inline-flex;
  width: 13.5rem;
  height: 3.25rem;
  padding: var(--dh-space-4, 1rem) var(--dh-space-6, 1.5rem);
  align-items: center;
  justify-content: center;
  border-radius: var(--dh-radius-none, 0);
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
  letter-spacing: 0.00625rem;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.dh-button--primary {
  border: var(--dh-stroke-thin, 1px) solid var(--dh-color-bg-accent, #e8452e);
  background: var(--dh-color-bg-accent, #e8452e);
  color: var(--dh-color-text-inverse, #ffffff);
}

.dh-button--primary:hover:not(:disabled) {
  border-color: var(--dh-color-bg-accent-hover, #c93624);
  background: var(--dh-color-bg-accent-hover, #c93624);
}

.dh-button--secondary {
  border: var(--dh-stroke-thin, 1px) solid var(--dh-color-border-strong, #080a0d);
  background: var(--dh-color-bg-surface, #ffffff);
  color: var(--dh-color-text-primary, #080a0d);
}

.dh-button--secondary:hover:not(:disabled) {
  background: var(--dh-color-bg-status, #c9f24d);
}

.dh-button:focus-visible {
  outline: 2px solid var(--dh-color-bg-status, #c9f24d);
  outline-offset: 3px;
}

.dh-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
