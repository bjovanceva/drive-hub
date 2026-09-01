<script lang="ts" setup>
import { schoolRoutes } from '#shared/constants/routes'

definePageMeta({ layout: 'default' })

const route = useRoute()
const schoolId = computed(() => Number(route.params.id))

const { data: school, status: schoolStatus, error: schoolError } = await useFetch<any>(`/api/driving-schools/${schoolId.value}`)
const { data: vehicles } = await useFetch<any[]>(`/api/driving-schools/${schoolId.value}/vehicles`)

const categoryList = computed(() => school.value?.categories ?? [])
const vehicleList = computed(() => vehicles.value ?? [])

function formatPrice(value: number | string | null | undefined) {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '0'))
  return Number.isFinite(numeric) && numeric > 0 ? `${new Intl.NumberFormat('en-US').format(numeric)} MKD` : 'Contact school'
}

function formatAddress(raw: string | null | undefined) {
  return raw?.trim() || 'Address not listed'
}
</script>

<template>
  <div class="dh-school-detail-page">
    <section class="dh-school-detail-page__hero">
      <div class="dh-school-detail-page__container">
        <p>School / Profile</p>
        <h1>{{ school?.name || 'Driving school' }}</h1>

        <div class="dh-school-detail-page__actions">
          <NuxtLink class="dh-school-detail-page__secondary" :to="schoolRoutes.list">← Back to schools</NuxtLink>
          <NuxtLink class="dh-school-detail-page__primary" to="/start-application">Start application</NuxtLink>
        </div>
      </div>
    </section>

    <section class="dh-school-detail-page__body">
      <div class="dh-school-detail-page__container">
        <div v-if="schoolStatus === 'pending'" class="dh-school-detail-page__state" role="status">
          Loading school details…
        </div>

        <div v-else-if="schoolError || !school" class="dh-school-detail-page__state" role="alert">
          We couldn’t load the details for this school.
        </div>

        <div v-else class="dh-school-detail-page__grid">
          <article class="dh-school-detail-page__card">
            <span class="dh-school-detail-page__eyebrow">Overview</span>
            <h2>{{ school.name }}</h2>

            <dl class="dh-school-detail-page__meta">
              <div>
                <dt>Address</dt>
                <dd>{{ formatAddress(school.address) }}</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>{{ school.city || 'Not specified' }}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{{ school.phone || 'Not listed' }}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{{ school.email || 'Not listed' }}</dd>
              </div>
            </dl>

            <p class="dh-school-detail-page__description">
              {{ school.description || 'This school has no description yet.' }}
            </p>
          </article>

          <article class="dh-school-detail-page__card">
            <span class="dh-school-detail-page__eyebrow">Programmes</span>
            <h2>Categories & prices</h2>

            <ul class="dh-school-detail-page__list">
              <li v-for="category in categoryList" :key="category.id">
                <span>{{ category.name }}</span>
                <strong>{{ formatPrice(category.price) }}</strong>
              </li>
              <li v-if="!categoryList.length" class="dh-school-detail-page__empty">No categories added yet.</li>
            </ul>
          </article>

          <article class="dh-school-detail-page__card dh-school-detail-page__card--wide">
            <span class="dh-school-detail-page__eyebrow">Fleet</span>
            <h2>Available instructors & vehicles</h2>

            <ul class="dh-school-detail-page__list dh-school-detail-page__list--stacked">
              <li v-for="vehicle in vehicleList" :key="vehicle.id">
                <div>
                  <span>{{ vehicle.registration }}</span>
                  <small>{{ vehicle.brand }} {{ vehicle.model }} · {{ vehicle.year }}</small>
                </div>
                <strong>{{ vehicle.instructorName || 'Instructor unassigned' }}</strong>
              </li>
              <li v-if="!vehicleList.length" class="dh-school-detail-page__empty">No vehicles assigned yet.</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dh-school-detail-page,
.dh-school-detail-page * { box-sizing: border-box; }
.dh-school-detail-page { min-height: 100vh; background: var(--dh-color-bg-page); }
.dh-school-detail-page__container { width: min(100%, 78rem); margin-inline: auto; }

.dh-school-detail-page__hero {
  padding: 4.5rem 6rem 3rem;
  background: var(--dh-color-bg-inverse);
  color: var(--dh-color-text-inverse);
}

.dh-school-detail-page__hero p,
.dh-school-detail-page__hero h1 { margin: 0; }

.dh-school-detail-page__hero p {
  color: var(--dh-color-bg-status);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-school-detail-page__hero h1 {
  margin-top: 1rem;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(4rem, 7vw, 7rem);
  line-height: 0.82;
  letter-spacing: -0.08rem;
  text-transform: uppercase;
}

.dh-school-detail-page__actions {
  display: flex;
  margin-top: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.dh-school-detail-page__primary,
.dh-school-detail-page__secondary {
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border: 1px solid var(--dh-color-border-strong);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05rem;
  text-decoration: none;
  text-transform: uppercase;
}

.dh-school-detail-page__primary {
  background: var(--dh-color-bg-status);
  color: var(--dh-color-text-primary);
}

.dh-school-detail-page__secondary {
  background: transparent;
  color: var(--dh-color-text-inverse);
}

.dh-school-detail-page__body { padding: 4rem 6rem 6rem; }

.dh-school-detail-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem;
}

.dh-school-detail-page__card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 2rem;
  border: 1px solid var(--dh-color-border-strong);
  background: var(--dh-color-bg-surface);
}

.dh-school-detail-page__card--wide {
  grid-column: 1 / -1;
}

.dh-school-detail-page__eyebrow {
  color: var(--dh-color-bg-accent);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-school-detail-page__card h2 {
  margin: 0;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1;
  text-transform: uppercase;
}

.dh-school-detail-page__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
}

.dh-school-detail-page__meta div {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--dh-color-border-default);
  background: #f7f8f7;
}

.dh-school-detail-page__meta dt {
  color: var(--dh-color-text-secondary);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05rem;
  text-transform: uppercase;
}

.dh-school-detail-page__meta dd {
  margin: 0;
  font-weight: 600;
}

.dh-school-detail-page__description {
  margin: 0;
  color: var(--dh-color-text-secondary);
  line-height: 1.7;
}

.dh-school-detail-page__list {
  display: grid;
  gap: 0.75rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.dh-school-detail-page__list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--dh-color-border-default);
  background: #fff;
}

.dh-school-detail-page__list li div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.dh-school-detail-page__list li span {
  font-weight: 700;
}

.dh-school-detail-page__list li small {
  color: var(--dh-color-text-secondary);
  font-size: 0.72rem;
}

.dh-school-detail-page__list li strong {
  font-size: 0.8rem;
}

.dh-school-detail-page__list--stacked li {
  align-items: flex-start;
}

.dh-school-detail-page__empty {
  color: var(--dh-color-text-secondary);
  font-weight: 600;
}

.dh-school-detail-page__state {
  padding: 2rem;
  border: 1px solid var(--dh-color-border-strong);
  background: var(--dh-color-bg-surface);
  font-weight: 600;
}

@media (max-width: 62rem) {
  .dh-school-detail-page__hero,
  .dh-school-detail-page__body { padding-inline: 2rem; }
  .dh-school-detail-page__grid { grid-template-columns: 1fr; }
}

@media (max-width: 34rem) {
  .dh-school-detail-page__hero,
  .dh-school-detail-page__body { padding-inline: 1.25rem; }
  .dh-school-detail-page__meta { grid-template-columns: 1fr; }
  .dh-school-detail-page__actions { flex-direction: column; align-items: flex-start; }
}
</style>
