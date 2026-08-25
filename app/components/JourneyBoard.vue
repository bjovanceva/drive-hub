<script lang="ts" setup>
import raceBar from '~/assets/race-bar.svg'
import type { JourneyStepPresentationDto } from '~/types/presentation/home'

defineProps<{
  steps: JourneyStepPresentationDto[]
}>()
</script>

<template>
  <div class="dh-journey-board" data-node-id="34:128">
    <img class="dh-journey-board__rail" :src="raceBar" alt="" width="1246" height="16">

    <div class="dh-journey-board__steps">
      <article v-for="step in steps" :key="step.id" class="dh-journey-board__step">
        <div class="dh-journey-board__step-header">
          <span class="dh-journey-board__number">{{ step.number }}</span>
          <span
            class="dh-journey-board__tag"
            :class="{ 'dh-journey-board__tag--ready': step.status === 'ready' }"
          >
            {{ step.tag }}
          </span>
        </div>
        <h3>{{ step.title }}</h3>
        <p>{{ step.description }}</p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.dh-journey-board {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--dh-color-border-strong, #080a0d);
  border-radius: var(--dh-radius-none, 0);
  background: var(--dh-color-bg-inverse, #080a0d);
}

.dh-journey-board__rail {
  display: block;
  width: 100%;
  height: 1rem;
  object-fit: fill;
}

.dh-journey-board__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.dh-journey-board__step {
  display: flex;
  min-height: 15.625rem;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.75rem 2rem;
  color: var(--dh-color-text-inverse, #ffffff);
}

.dh-journey-board__step:not(:last-child) {
  border-right: 1px solid var(--dh-color-border-strong, #3c454f);
}

.dh-journey-board__step-header {
  display: flex;
  height: 2.75rem;
  align-items: center;
  justify-content: space-between;
}

.dh-journey-board__number {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 2.75rem;
  letter-spacing: -0.01875rem;
}

.dh-journey-board__tag {
  color: var(--dh-color-bg-accent, #e8452e);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1rem;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-journey-board__tag--ready {
  color: var(--dh-color-bg-status, #c9f24d);
}

.dh-journey-board h3,
.dh-journey-board p {
  margin: 0;
}

.dh-journey-board h3 {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 2rem;
  text-transform: uppercase;
}

.dh-journey-board p {
  color: var(--dh-steel-300, #c8ced4);
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

@media (max-width: 48rem) {
  .dh-journey-board__steps {
    grid-template-columns: 1fr;
  }

  .dh-journey-board__step {
    min-height: auto;
  }

  .dh-journey-board__step:not(:last-child) {
    border-right: 0;
    border-bottom: 1px solid var(--dh-color-border-strong, #3c454f);
  }
}
</style>
