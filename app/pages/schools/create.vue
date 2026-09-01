<script lang="ts" setup>
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Create driving school | Drive Hub',
  description: 'Create a new driving school profile and add it to the Drive Hub directory.'
})
</script>

<template>
  <div class="dh-school-create-page">
    <section class="dh-school-create-page__hero">
      <div class="dh-school-create-page__container">
        <p>Operations / New school</p>
        <h1>Create a<br><span>driving school.</span></h1>
        <p class="dh-school-create-page__intro">
          Add a school profile, contact details, and location so learners can discover it from the live directory.
        </p>
      </div>
    </section>

    <section class="dh-school-create-page__body">
      <div class="dh-school-create-page__container">
        <DrivingSchoolForm />
      </div>
    </section>
  </div>
</template>

<style scoped>
.dh-school-create-page,
.dh-school-create-page * { box-sizing: border-box; }
.dh-school-create-page { min-height: 100vh; background: var(--dh-color-bg-page); }
.dh-school-create-page__container { width: min(100%, 78rem); margin-inline: auto; }

.dh-school-create-page__hero {
  padding: 4.5rem 6rem 3rem;
  background: var(--dh-color-bg-inverse);
  color: var(--dh-color-text-inverse);
}

.dh-school-create-page__hero p,
.dh-school-create-page__hero h1,
.dh-school-create-page__intro { margin: 0; }

.dh-school-create-page__hero p:first-child {
  color: var(--dh-color-bg-status);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-school-create-page__hero h1 {
  margin-top: 1.25rem;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(4rem, 8vw, 7rem);
  font-weight: 900;
  line-height: 0.82;
  letter-spacing: -0.08rem;
  text-transform: uppercase;
}

.dh-school-create-page__hero h1 span { color: var(--dh-color-bg-accent); }

.dh-school-create-page__intro {
  max-width: 42rem;
  margin-top: 1.5rem;
  color: #d8dcdf;
  font-size: 1.05rem;
  line-height: 1.7;
}

.dh-school-create-page__body {
  padding: 4rem 6rem 6rem;
}

@media (max-width: 62rem) {
  .dh-school-create-page__hero,
  .dh-school-create-page__body { padding-inline: 2rem; }
}

@media (max-width: 34rem) {
  .dh-school-create-page__hero,
  .dh-school-create-page__body { padding-inline: 1.25rem; }
}
</style>
