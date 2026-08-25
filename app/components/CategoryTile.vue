<script lang="ts" setup>
const props = withDefaults(defineProps<{
  code: string
  label: string
  meta: string
  to?: string
  actionText?: string
  revealDelay?: number
}>(), {
  to: '#',
  actionText: 'Explore →',
  revealDelay: 0
})

const {
  target: tileRef,
  isMotionReady,
  isRevealed
} = useScrollReveal({ threshold: 0.22 })
</script>

<template>
  <div
    ref="tileRef"
    class="dh-category-tile-reveal"
    :class="{
      'dh-category-tile--motion-ready': isMotionReady,
      'dh-category-tile--visible': isRevealed
    }"
    :style="{ '--dh-reveal-delay': `${props.revealDelay}ms` }"
  >
    <NuxtLink
      class="dh-category-tile"
      :to="props.to"
      :aria-label="`${props.label}: ${props.actionText}`"
      data-node-id="27:7"
    >
      <span class="dh-category-tile__stripe" aria-hidden="true" />

      <span class="dh-category-tile__code-panel">
        <span class="dh-category-tile__code">{{ props.code }}</span>
      </span>

      <span class="dh-category-tile__info">
        <span class="dh-category-tile__label">{{ props.label }}</span>
        <span class="dh-category-tile__meta">{{ props.meta }}</span>
        <span class="dh-category-tile__action">{{ props.actionText }}</span>
      </span>
    </NuxtLink>
  </div>
</template>

<style scoped>
.dh-category-tile,
.dh-category-tile * {
  box-sizing: border-box;
}

.dh-category-tile-reveal {
  width: min(100%, 21.5rem);
}

.dh-category-tile {
  display: flex;
  width: 100%;
  height: 11rem;
  overflow: hidden;
  align-items: stretch;
  border: var(--dh-stroke-thin, 1px) solid var(--dh-color-border-strong, #080a0d);
  border-radius: var(--dh-radius-none, 0);
  background: var(--dh-color-bg-surface, #ffffff);
  color: var(--dh-color-text-primary, #080a0d);
  text-decoration: none;
}

.dh-category-tile--motion-ready:not(.dh-category-tile--visible) {
  opacity: 0;
  transform: translate3d(-4.5rem, 0, 0) scale(0.76) skewX(6deg);
  transform-origin: left center;
}

.dh-category-tile--motion-ready.dh-category-tile--visible {
  transform-origin: left center;
  animation: dh-category-zoom-left-in 620ms cubic-bezier(0.16, 1, 0.3, 1) var(--dh-reveal-delay, 0ms) both;
}

.dh-category-tile__stripe {
  width: 0.75rem;
  flex: 0 0 0.75rem;
  background: var(--dh-color-bg-accent, #e8452e);
}

.dh-category-tile__code-panel {
  display: flex;
  width: 6.5rem;
  flex: 0 0 6.5rem;
  align-items: center;
  justify-content: center;
  background: var(--dh-color-bg-surface-dark, #11151a);
  color: var(--dh-color-text-inverse, #ffffff);
}

.dh-category-tile__code {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 3.5rem;
  letter-spacing: -0.025rem;
  text-transform: uppercase;
}

.dh-category-tile__info {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem 1.25rem 1.25rem;
  background: var(--dh-color-bg-surface, #ffffff);
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.dh-category-tile__label,
.dh-category-tile__action {
  font-weight: 600;
  letter-spacing: 0.00625rem;
  text-transform: uppercase;
}

.dh-category-tile__meta {
  min-height: 2.5rem;
  color: var(--dh-color-text-secondary, #3c454f);
  font-weight: 400;
  text-transform: uppercase;
}

.dh-category-tile__action {
  margin-top: auto;
  transition: color 160ms ease;
}

.dh-category-tile:hover .dh-category-tile__action {
  color: var(--dh-color-bg-accent, #e8452e);
}

.dh-category-tile:focus-visible {
  outline: 2px solid var(--dh-color-bg-status, #c9f24d);
  outline-offset: 3px;
}

@keyframes dh-category-zoom-left-in {
  0% {
    opacity: 0;
    transform: translate3d(-4.5rem, 0, 0) scale(0.76) skewX(6deg);
  }

  68% {
    opacity: 1;
    transform: translate3d(0.5rem, 0, 0) scale(1.035) skewX(-1deg);
  }

  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1) skewX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dh-category-tile--motion-ready,
  .dh-category-tile--motion-ready:not(.dh-category-tile--visible),
  .dh-category-tile--motion-ready.dh-category-tile--visible {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>
