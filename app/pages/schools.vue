<script setup lang="ts">
</script>

<template>
  <NuxtPage />
</template>

<style scoped>
.dh-schools-page,
.dh-schools-page * { box-sizing: border-box; }
.dh-schools-page { min-height: 100vh; overflow: hidden; background: var(--dh-color-bg-page); }
.dh-schools-page__container { width: 100%; max-width: 78rem; margin-inline: auto; }

.dh-schools-page__hero { padding: 4.5rem 6rem 4rem; background: var(--dh-color-bg-inverse); color: var(--dh-color-text-inverse); }
.dh-schools-page__hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) 18rem; align-items: end; gap: 4rem; margin-bottom: 3rem; }
.dh-schools-page__hero-copy { max-width: 46rem; }
.dh-schools-page__eyebrow,
.dh-schools-page h1,
.dh-schools-page h2,
.dh-schools-page p { margin: 0; }
.dh-schools-page__eyebrow { margin-bottom: 1rem; color: var(--dh-color-bg-status); font-family: 'Barlow Condensed', sans-serif; font-size: 0.875rem; font-weight: 600; letter-spacing: 0.075rem; text-transform: uppercase; }
.dh-schools-page__hero h1 { font-family: 'Barlow Condensed', sans-serif; font-size: clamp(4.5rem, 8vw, 7.5rem); font-weight: 900; line-height: 0.82; letter-spacing: -0.08rem; text-transform: uppercase; }
.dh-schools-page__hero h1 span { color: var(--dh-color-bg-accent); }
.dh-schools-page__intro { max-width: 39rem; margin-top: 1.75rem !important; color: #d8dcdf; font-size: 1.05rem; line-height: 1.65; }

.dh-schools-page__brief { min-height: 14rem; padding: 1.5rem; border: 1px solid #424950; border-top: 0.5rem solid var(--dh-color-bg-status); background: var(--dh-color-bg-surface-dark); }
.dh-schools-page__brief > p,
.dh-schools-page__brief > span { color: #aeb5bb; font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.075rem; text-transform: uppercase; }
.dh-schools-page__brief strong { display: block; margin: 1.25rem 0 0.25rem; font-family: 'Barlow Condensed', sans-serif; font-size: 4.5rem; line-height: 0.85; }
.dh-schools-page__brief > div { display: flex; margin-top: 2rem; padding-top: 1rem; align-items: center; gap: 0.5rem; border-top: 1px solid #424950; font-size: 0.6875rem; text-transform: uppercase; }
.dh-schools-page__brief i,
.dh-schools-page__note i { width: 0.5rem; height: 0.5rem; background: var(--dh-color-bg-status); }

.dh-schools-page__directory { padding: 5rem 6rem 6rem; }
.dh-schools-page__results-header { display: flex; margin-bottom: 2.5rem; align-items: flex-end; justify-content: space-between; gap: 2rem; }
.dh-schools-page__eyebrow--dark { margin-bottom: 0.75rem; color: var(--dh-color-bg-accent); }
.dh-schools-page__results-header h2 { font-family: 'Barlow Condensed', sans-serif; font-size: clamp(2.25rem, 4vw, 3.5rem); line-height: 1; text-transform: uppercase; }
.dh-schools-page__results-header > div > p:last-child { margin-top: 0.75rem; color: var(--dh-color-text-secondary); font-size: 0.875rem; }
.dh-schools-page__results-actions { display: flex; align-items: flex-end; gap: 1rem; }
.dh-schools-page__cta { display: inline-flex; min-height: 3rem; padding: 0.75rem 1rem; align-items: center; border: 1px solid var(--dh-color-border-strong); background: var(--dh-color-bg-status); color: var(--dh-color-text-primary); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04rem; text-decoration: none; text-transform: uppercase; }

.dh-schools-page__sort { display: flex; width: 15rem; flex: 0 0 15rem; flex-direction: column; gap: 0.5rem; font-family: 'Barlow Condensed', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06rem; text-transform: uppercase; }
.dh-schools-page__sort-control { position: relative; display: block; }
.dh-schools-page__sort select { width: 100%; height: 3rem; padding: 0 3rem 0 0.875rem; border: 1px solid var(--dh-color-border-strong); border-radius: 0; appearance: none; background: var(--dh-color-bg-surface); font-size: 0.875rem; font-weight: 600; text-transform: uppercase; cursor: pointer; }
.dh-schools-page__sort-control i { position: absolute; top: 0; right: 0; display: grid; width: 2.5rem; height: 3rem; border-left: 1px solid var(--dh-color-border-strong); background: var(--dh-color-bg-status); font-family: 'Inter', sans-serif; font-size: 1.25rem; font-style: normal; place-items: center; pointer-events: none; }
.dh-schools-page__sort select:focus-visible { outline: 3px solid var(--dh-color-bg-status); outline-offset: 3px; }
.dh-schools-page__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem; }

.dh-schools-page__state { display: flex; min-height: 22rem; padding: 3rem; align-items: center; justify-content: center; flex-direction: column; gap: 1rem; border: 1px solid var(--dh-color-border-strong); background: var(--dh-color-bg-surface); text-align: center; }
.dh-schools-page__state strong { font-family: 'Barlow Condensed', sans-serif; font-size: 2rem; text-transform: uppercase; }
.dh-schools-page__state button { min-height: 3rem; padding: 0.75rem 1rem; border: 1px solid var(--dh-color-border-strong); border-radius: 0; background: var(--dh-color-bg-status); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; cursor: pointer; }
.dh-schools-page__empty-number { color: var(--dh-color-border-default); font-family: 'Barlow Condensed', sans-serif; font-size: 5rem; font-weight: 900; line-height: 1; }
.dh-schools-page__loader { width: 2rem; height: 2rem; border: 3px solid var(--dh-color-border-default); border-top-color: var(--dh-color-bg-accent); animation: dh-grid-spin 700ms linear infinite; }

.dh-schools-page__note { padding: 1.25rem 6rem; background: var(--dh-color-bg-status); }
.dh-schools-page__note-inner { display: flex; align-items: center; justify-content: space-between; gap: 2rem; }
.dh-schools-page__note p { font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04rem; text-transform: uppercase; }
.dh-schools-page__note p:first-child { display: flex; align-items: center; gap: 0.5rem; }
.dh-schools-page__note i { background: var(--dh-color-bg-inverse); }

@keyframes dh-grid-spin { to { transform: rotate(360deg); } }

@media (max-width: 70rem) {
  .dh-schools-page__hero,
  .dh-schools-page__directory,
  .dh-schools-page__note { padding-inline: 3rem; }
}

@media (max-width: 56rem) {
  .dh-schools-page__hero-grid { grid-template-columns: 1fr; }
  .dh-schools-page__brief { display: grid; min-height: auto; grid-template-columns: auto auto 1fr; align-items: end; gap: 0.75rem; }
  .dh-schools-page__brief strong { margin: 0; }
  .dh-schools-page__brief > div { margin: 0; padding: 0; border: 0; justify-self: end; }
  .dh-schools-page__grid { grid-template-columns: 1fr; }
}

@media (max-width: 48rem) {
  .dh-schools-page__hero,
  .dh-schools-page__directory,
  .dh-schools-page__note { padding-inline: 1.25rem; }
  .dh-schools-page__hero { padding-block: 3rem; }
  .dh-schools-page__directory { padding-block: 4rem; }
  .dh-schools-page__results-header,
  .dh-schools-page__note-inner { align-items: flex-start; flex-direction: column; }
  .dh-schools-page__sort { width: 100%; flex-basis: auto; }
}

@media (max-width: 34rem) {
  .dh-schools-page__brief { grid-template-columns: auto 1fr; }
  .dh-schools-page__brief > p,
  .dh-schools-page__brief > div { grid-column: 1 / -1; justify-self: start; }
}

@media (prefers-reduced-motion: reduce) {
  .dh-schools-page__loader { animation: none; }
}
</style>
