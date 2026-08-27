<script lang="ts" setup>
import schoolCardTrack from '~/assets/school-card-track.svg'

const props = withDefaults(defineProps<{
  schoolName: string
  location: string
  licenceType: string
  price: string
  to?: string
  verified?: boolean
  actionText?: string
  revealDelay?: number
}>(), {
  to: '#',
  verified: true,
  actionText: 'View school →',
  revealDelay: 0
})

const {
  target: cardRef,
  isMotionReady,
  isRevealed
} = useScrollReveal()
</script>

<template>
  <article
    ref="cardRef"
    class="dh-school-card"
    :class="{
      'dh-school-card--motion-ready': isMotionReady,
      'dh-school-card--visible': isRevealed
    }"
    :style="{ '--dh-reveal-delay': `${props.revealDelay}ms` }"
    data-node-id="25:7"
  >
    <img
      class="dh-school-card__track"
      :src="schoolCardTrack"
      alt=""
      width="344"
      height="152"
    >

    <div class="dh-school-card__content">
      <div v-if="props.verified" class="dh-school-card__verification">
        <span class="dh-school-card__signal" aria-hidden="true" />
        <span>Verified school</span>
      </div>

      <h3 class="dh-school-card__name">
        {{ props.schoolName }}
      </h3>
      <p class="dh-school-card__location">
        {{ props.location }}
      </p>
      <p class="dh-school-card__licence">
        {{ props.licenceType }}
      </p>

      <div class="dh-school-card__footer">
        <span class="dh-school-card__price">{{ props.price }}</span>
        <NuxtLink class="dh-school-card__action" :to="props.to">
          {{ props.actionText }}
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.dh-school-card,
.dh-school-card * {
  box-sizing: border-box;
}

.dh-school-card {
  display: flex;
  width: min(100%, 21.5rem);
  height: 26.25rem;
  flex-direction: column;
  overflow: hidden;
  border: var(--dh-stroke-thin, 1px) solid var(--dh-color-border-strong, #080a0d);
  border-radius: var(--dh-radius-none, 0);
  background: var(--dh-color-bg-surface, #ffffff);
}

.dh-school-card--motion-ready:not(.dh-school-card--visible) {
  opacity: 0;
  transform: translate3d(-8rem, 0, 0) skewX(9deg) scaleX(0.88);
}

.dh-school-card--motion-ready.dh-school-card--visible {
  animation: dh-school-lightspeed-in 720ms cubic-bezier(0.16, 1, 0.3, 1) var(--dh-reveal-delay, 0ms) both;
}

.dh-school-card__track {
  display: block;
  width: 100%;
  height: 9.5rem;
  flex: 0 0 9.5rem;
  object-fit: fill;
}

.dh-school-card__content {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1.25rem;
  background: var(--dh-color-bg-surface, #ffffff);
}

.dh-school-card__verification {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--dh-color-text-secondary, #3c454f);
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
  letter-spacing: 0.025rem;
  text-transform: uppercase;
}

.dh-school-card__signal {
  width: 0.5rem;
  height: 0.5rem;
  flex: 0 0 0.5rem;
  background: var(--dh-color-bg-status, #c9f24d);
}

.dh-school-card__name,
.dh-school-card__location,
.dh-school-card__licence {
  margin: 0;
}

.dh-school-card__name {
  color: var(--dh-color-text-primary, #080a0d);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 2rem;
  text-transform: uppercase;
}

.dh-school-card__location,
.dh-school-card__licence,
.dh-school-card__footer {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.dh-school-card__location {
  color: var(--dh-color-text-secondary, #3c454f);
  font-weight: 400;
  text-transform: uppercase;
}

.dh-school-card__licence {
  color: var(--dh-color-text-primary, #080a0d);
  font-weight: 600;
  letter-spacing: 0.00625rem;
  text-transform: uppercase;
}

.dh-school-card__footer {
  display: flex;
  min-height: 3.5625rem;
  margin-top: auto;
  padding-top: 1.25rem;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid var(--dh-color-border-default, #c8ced4);
  color: var(--dh-color-text-primary, #080a0d);
  font-weight: 600;
  letter-spacing: 0.00625rem;
  text-transform: uppercase;
}

.dh-school-card__price {
  white-space: nowrap;
}

.dh-school-card__action {
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
}

.dh-school-card__action:hover {
  color: var(--dh-color-bg-accent, #e8452e);
}

.dh-school-card__action:focus-visible {
  outline: 2px solid var(--dh-color-bg-status, #c9f24d);
  outline-offset: 3px;
}

@keyframes dh-school-lightspeed-in {
  0% {
    opacity: 0;
    transform: translate3d(-8rem, 0, 0) skewX(9deg) scaleX(0.88);
  }

  62% {
    opacity: 1;
    transform: translate3d(0.75rem, 0, 0) skewX(-1.5deg) scaleX(1.02);
  }

  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) skewX(0) scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dh-school-card--motion-ready,
  .dh-school-card--motion-ready:not(.dh-school-card--visible),
  .dh-school-card--motion-ready.dh-school-card--visible {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>
