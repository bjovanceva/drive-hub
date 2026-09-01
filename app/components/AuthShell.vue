<script lang="ts" setup>
defineProps<{
  eyebrow: string
  title: string
  description: string
  alternativeLabel: string
  alternativeTo: string
}>()
</script>

<template>
  <div class="dh-auth-shell">
    <section class="dh-auth-shell__intro">
      <div>
        <p>{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <span>{{ description }}</span>
      </div>
      <small>Drive Hub / Secure access</small>
    </section>

    <section class="dh-auth-shell__form-panel">
      <div class="dh-auth-shell__form-wrap">
        <slot />
        <p class="dh-auth-shell__alternative">
          {{ alternativeLabel }}
          <NuxtLink :to="alternativeTo">Continue →</NuxtLink>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dh-auth-shell,
.dh-auth-shell * { box-sizing: border-box; }
.dh-auth-shell { display: grid; min-height: calc(100vh - 5rem); grid-template-columns: minmax(0, 1fr) minmax(28rem, 0.78fr); background: var(--dh-color-bg-page); }
.dh-auth-shell__intro { display: flex; min-height: 42rem; padding: 5rem 6rem; justify-content: space-between; flex-direction: column; background: var(--dh-color-bg-inverse); color: var(--dh-color-text-inverse); }
.dh-auth-shell__intro p,
.dh-auth-shell__intro h1,
.dh-auth-shell__intro span { margin: 0; }
.dh-auth-shell__intro p { margin-bottom: 1.25rem; color: var(--dh-color-bg-status); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.075rem; text-transform: uppercase; }
.dh-auth-shell__intro h1 { max-width: 42rem; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(4.5rem, 8vw, 7.5rem); font-weight: 900; line-height: 0.82; letter-spacing: -0.08rem; text-transform: uppercase; }
.dh-auth-shell__intro span { display: block; max-width: 36rem; margin-top: 2rem; color: #c8ced4; line-height: 1.7; }
.dh-auth-shell__intro small { color: #8f989f; font-size: 0.6875rem; letter-spacing: 0.075rem; text-transform: uppercase; }
.dh-auth-shell__form-panel { display: flex; padding: 4rem; align-items: center; background: var(--dh-color-bg-surface); }
.dh-auth-shell__form-wrap { width: min(100%, 30rem); margin-inline: auto; }
.dh-auth-shell__alternative { display: flex; margin: 2rem 0 0; justify-content: space-between; gap: 1rem; color: var(--dh-color-text-secondary); font-size: 0.8125rem; }
.dh-auth-shell__alternative a { color: var(--dh-color-text-primary); font-weight: 700; text-decoration: none; }
:deep(.dh-auth-form) { display: flex; flex-direction: column; gap: 1.25rem; }
:deep(.dh-auth-form__heading) { margin-bottom: 1rem; }
:deep(.dh-auth-form__heading span) { color: var(--dh-color-bg-accent); font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.075rem; text-transform: uppercase; }
:deep(.dh-auth-form__heading h2) { margin: 0.5rem 0 0; font-family: 'Barlow Condensed', sans-serif; font-size: 3rem; line-height: 1; text-transform: uppercase; }
:deep(.dh-auth-form label) { display: flex; flex-direction: column; gap: 0.5rem; color: var(--dh-color-text-secondary); font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.05rem; text-transform: uppercase; }
:deep(.dh-auth-form input) { width: 100%; height: 3.5rem; padding: 0 1rem; border: 1px solid var(--dh-color-border-strong); border-radius: 0; background: #fff; color: var(--dh-color-text-primary); font: inherit; }
:deep(.dh-auth-form input:focus-visible) { outline: 3px solid var(--dh-color-bg-status); outline-offset: 2px; }
:deep(.dh-auth-form__error) { margin: 0; padding: 0.875rem 1rem; border-left: 0.3rem solid var(--dh-color-bg-accent); background: #fff0ed; color: #8f2619; font-size: 0.8125rem; line-height: 1.5; }
:deep(.dh-auth-form button) { min-height: 3.75rem; border: 1px solid var(--dh-color-border-strong); border-radius: 0; background: var(--dh-color-bg-accent); color: #fff; font-weight: 800; letter-spacing: 0.04rem; text-transform: uppercase; cursor: pointer; }
:deep(.dh-auth-form button:hover) { background: var(--dh-color-bg-accent-hover); }
:deep(.dh-auth-form button:disabled) { cursor: wait; opacity: 0.65; }

@media (max-width: 58rem) {
  .dh-auth-shell { grid-template-columns: 1fr; }
  .dh-auth-shell__intro { min-height: 25rem; padding: 3.5rem 2rem; }
  .dh-auth-shell__form-panel { padding: 3.5rem 2rem; }
}

@media (max-width: 32rem) {
  .dh-auth-shell__intro h1 { font-size: 4rem; }
  .dh-auth-shell__form-panel { padding-inline: 1.25rem; }
  .dh-auth-shell__alternative { flex-direction: column; }
}
</style>
