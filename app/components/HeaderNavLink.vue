<script lang="ts" setup>
const props = defineProps<{
  label: string
  to: string
}>()
</script>

<template>
  <NuxtLink class="dh-header-link" :to="props.to">
    <span
      class="dh-header-link__shape dh-header-link__shape--top"
      aria-hidden="true"
    />
    <span
      class="dh-header-link__shape dh-header-link__shape--bottom"
      aria-hidden="true"
    />
    <span class="dh-header-link__label">{{ props.label }}</span>
  </NuxtLink>
</template>

<style scoped>
.dh-header-link {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--dh-color-text-inverse, #ffffff);
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
  letter-spacing: 0.00625rem;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
}

.dh-header-link__shape {
  position: absolute;
  z-index: -1;
  inset: -0.4375rem -0.625rem;
  opacity: 0;
  background: var(--dh-color-text-hover, #c9f24d);
  pointer-events: none;
  transition:
    opacity 170ms ease,
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dh-header-link__shape--top {
  clip-path: polygon(8% 0, 70% 0, 40% 100%, 0 100%);
  transform: translate3d(0, -0.875rem, 0);
}

.dh-header-link__shape--bottom {
  clip-path: polygon(70% 0, 100% 0, 92% 100%, 40% 100%);
  transform: translate3d(0, 0.875rem, 0);
}

.dh-header-link__label {
  position: relative;
  z-index: 1;
  transition: color 150ms ease;
}

.dh-header-link:hover .dh-header-link__shape,
.dh-header-link:focus-visible .dh-header-link__shape {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.dh-header-link:hover .dh-header-link__label,
.dh-header-link:focus-visible .dh-header-link__label {
  color: var(--dh-color-text-primary, #080a0d);
}

.dh-header-link:focus-visible {
  outline: 2px solid var(--dh-color-text-hover, #c9f24d);
  outline-offset: 6px;
}

@media (prefers-reduced-motion: reduce) {
  .dh-header-link__shape,
  .dh-header-link__label {
    transition: none;
  }

  .dh-header-link__shape--top,
  .dh-header-link__shape--bottom {
    transform: none;
  }
}
</style>
