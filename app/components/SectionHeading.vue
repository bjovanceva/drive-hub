<script lang="ts" setup>
withDefaults(defineProps<{
  eyebrow: string
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
  theme?: 'light' | 'dark'
}>(), {
  description: undefined,
  actionLabel: undefined,
  actionTo: '#',
  theme: 'light'
})
</script>

<template>
  <header class="dh-section-heading" :class="`dh-section-heading--${theme}`">
    <div class="dh-section-heading__copy">
      <p class="dh-section-heading__eyebrow">{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
    </div>

    <p v-if="description" class="dh-section-heading__description">
      {{ description }}
    </p>

    <NuxtLink v-if="actionLabel" class="dh-section-heading__action" :to="actionTo">
      {{ actionLabel }}
    </NuxtLink>
  </header>
</template>

<style scoped>
.dh-section-heading {
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  gap: 3rem;
}

.dh-section-heading__copy {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.dh-section-heading__eyebrow,
.dh-section-heading h2,
.dh-section-heading__description {
  margin: 0;
}

.dh-section-heading__eyebrow {
  color: var(--dh-color-bg-accent, #e8452e);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1rem;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-section-heading h2 {
  color: var(--dh-color-text-primary, #080a0d);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(2.75rem, 4vw, 3.5rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.025rem;
  text-transform: uppercase;
}

.dh-section-heading__description {
  width: 27.5rem;
  max-width: 100%;
  color: var(--dh-color-text-secondary, #3c454f);
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5rem;
}

.dh-section-heading__action {
  color: var(--dh-color-text-primary, #080a0d);
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
  letter-spacing: 0.00625rem;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
}

.dh-section-heading__action:hover {
  color: var(--dh-color-bg-accent, #e8452e);
}

.dh-section-heading--dark .dh-section-heading__eyebrow {
  color: var(--dh-color-bg-status, #c9f24d);
}

.dh-section-heading--dark h2,
.dh-section-heading--dark .dh-section-heading__description,
.dh-section-heading--dark .dh-section-heading__action {
  color: var(--dh-color-text-inverse, #ffffff);
}

.dh-section-heading--dark .dh-section-heading__action:hover {
  color: var(--dh-color-bg-accent, #e8452e);
}

@media (max-width: 48rem) {
  .dh-section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>
