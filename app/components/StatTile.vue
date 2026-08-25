<script lang="ts" setup>
defineProps<{
  value: string
  label: string
  meta: string
}>()
</script>

<template>
  <article class="dh-stat-tile" data-node-id="22:3">
    <span class="dh-stat-tile__marker" aria-hidden="true" />

    <div class="dh-stat-tile__status">
      <span aria-hidden="true" />
      <span>Live network</span>
    </div>

    <strong>{{ value }}</strong>
    <h3>{{ label }}</h3>
    <p>{{ meta }}</p>
  </article>
</template>

<style scoped>
.dh-stat-tile {
  display: flex;
  width: min(100%, 21.5rem);
  height: 13rem;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  border: var(--dh-stroke-thin, 1px) solid var(--dh-color-border-default, #c8ced4);
  border-radius: var(--dh-radius-none, 0);
  background: var(--dh-color-bg-surface-dark, #11151a);
  color: var(--dh-color-text-inverse, #ffffff);
}

.dh-stat-tile__marker {
  width: 5rem;
  height: 0.25rem;
  flex: 0 0 0.25rem;
  background: var(--dh-color-bg-accent, #e8452e);
}

.dh-stat-tile__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1rem;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-stat-tile__status > span:first-child {
  width: 0.625rem;
  height: 0.625rem;
  background: var(--dh-color-bg-status, #c9f24d);
}

.dh-stat-tile strong,
.dh-stat-tile h3,
.dh-stat-tile p {
  margin: 0;
  text-transform: uppercase;
}

.dh-stat-tile strong {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 2.75rem;
  letter-spacing: -0.01875rem;
}

.dh-stat-tile h3 {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 2rem;
}

.dh-stat-tile p {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  line-height: 1.25rem;
}
</style>
