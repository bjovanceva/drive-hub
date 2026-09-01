
<script lang="ts" setup>
import { licenceCategories, type LicenceCategoryGroup } from '~/data/licenceCategories'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Licence Categories | Drive Hub',
  description: 'Explore every driving licence category in North Macedonia and find schools offering the programme you need.'
})

type CategoryFilter = 'all' | LicenceCategoryGroup

const activeFilter = ref<CategoryFilter>('all')
const searchTerm = ref('')

const filters: { value: CategoryFilter, label: string }[] = [
  { value: 'all', label: 'All 17' },
  { value: 'two-wheels', label: 'Two wheels' },
  { value: 'cars', label: 'Cars & trailers' },
  { value: 'goods', label: 'Goods' },
  { value: 'passenger', label: 'Passenger' },
  { value: 'national', label: 'National' }
]

// The composable keeps this page on the relational API and shares its request
// lifecycle with other pages that need the complete school catalogue.
const { schools } = useDrivingSchools()

// Category counts are derived from each school's persisted many-to-many
// relations, so a new school/category connection updates cards automatically.
const schoolCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const school of schools.value ?? []) {
    for (const category of school.categories) {
      const code = category.code?.toLowerCase()
      if (!code) continue
      counts.set(code, (counts.get(code) ?? 0) + 1)
    }
  }
  return counts
})

// Search and group filtering remain client-side because the full category list
// is small, static legal reference data rather than a paginated resource.
const visibleCategories = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  return licenceCategories.filter(category => {
    const matchesFilter = activeFilter.value === 'all' || category.group === activeFilter.value
    const matchesSearch = !query || [category.code, category.name, category.description]
      .some(value => value.toLowerCase().includes(query))
    return matchesFilter && matchesSearch
  })
})

const formatPrice = (price: number) => new Intl.NumberFormat('en-GB').format(price)
const schoolsOffering = (code: string) => schoolCounts.value.get(code) ?? 0
</script>

<template>
  <div class="dh-categories-page">
    <section class="dh-categories-page__hero" aria-labelledby="categories-title">
      <div class="dh-categories-page__container dh-categories-page__hero-grid">
        <div>
          <p class="dh-categories-page__eyebrow">Categories / North Macedonia</p>
          <h1 id="categories-title">Choose your<br><span>road class.</span></h1>
          <p class="dh-categories-page__intro">
            From your first moped to professional passenger transport, compare every recognised licence class and jump straight to schools that teach it.
          </p>
        </div>

        <aside class="dh-categories-page__summary" aria-label="Category directory summary">
          <span>Full directory</span>
          <strong>17</strong>
          <p>licence classes</p>
          <div><i aria-hidden="true" /> Complete national set</div>
        </aside>
      </div>
    </section>

    <section class="dh-categories-page__catalogue" aria-labelledby="category-grid-title">
      <div class="dh-categories-page__container">
        <header class="dh-categories-page__catalogue-header">
          <div>
            <p class="dh-categories-page__eyebrow dh-categories-page__eyebrow--dark">Programmes / Select your machine</p>
            <h2 id="category-grid-title">Find your category.</h2>
          </div>

          <label class="dh-categories-page__search">
            <span>Quick find</span>
            <input v-model="searchTerm" type="search" placeholder="Try B, motorcycle, bus…">
          </label>
        </header>

        <div class="dh-categories-page__filters" aria-label="Filter categories">
          <button
            v-for="filter in filters"
            :key="filter.value"
            type="button"
            :class="{ 'is-active': activeFilter === filter.value }"
            :aria-pressed="activeFilter === filter.value"
            @click="activeFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <div v-if="visibleCategories.length" class="dh-categories-page__grid">
          <NuxtLink
            v-for="(category, index) in visibleCategories"
            :key="category.code"
            class="dh-category-card"
            :class="{ 'dh-category-card--featured': category.code === 'b' }"
            :to="{ path: '/schools', query: { category: category.code } }"
            :aria-label="`Find schools for category ${category.code.toUpperCase()}`"
          >
            <span class="dh-category-card__topline">
              <span>{{ String(index + 1).padStart(2, '0') }} / {{ category.groupLabel }}</span>
              <span v-if="category.code === 'b'" class="dh-category-card__popular">Most popular</span>
            </span>

            <span class="dh-category-card__identity">
              <strong>{{ category.code.toUpperCase() }}</strong>
              <span>
                <b>{{ category.name }}</b>
                <small>Minimum age · {{ category.minimumAge }}</small>
              </span>
            </span>

            <span class="dh-category-card__description">{{ category.description }}</span>

            <span class="dh-category-card__metrics">
              <span>
                <small>Programme price</small>
                <strong>{{ formatPrice(category.price) }} <i>MKD</i></strong>
              </span>
              <span>
                <small>Schools offering</small>
                <strong>{{ schoolsOffering(category.code) }} <i>{{ schoolsOffering(category.code) === 1 ? 'school' : 'schools' }}</i></strong>
              </span>
            </span>

            <span class="dh-category-card__action">
              View matching schools <b aria-hidden="true">→</b>
            </span>
          </NuxtLink>
        </div>

        <div v-else class="dh-categories-page__empty">
          <strong>No category found.</strong>
          <span>Try a category code or a vehicle type.</span>
          <button type="button" @click="searchTerm = ''; activeFilter = 'all'">Show all categories →</button>
        </div>
      </div>
    </section>

    <section class="dh-categories-page__guide">
      <div class="dh-categories-page__container dh-categories-page__guide-grid">
        <div>
          <p class="dh-categories-page__eyebrow dh-categories-page__eyebrow--dark">Before you apply</p>
          <h2>Know what the price covers.</h2>
        </div>
        <p>
          Card prices are shared Drive Hub programme estimates for the standard training package. Medical checks, first aid, exam-centre fees, vehicle hire for the test, extra lessons, and retakes are separate.
        </p>
        <p class="dh-categories-page__age-note">
          * Category A is available from age 21 after holding A2 for two years, or directly from age 24. Professional categories can have prerequisite-licence and experience rules.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dh-categories-page,
.dh-categories-page * { box-sizing: border-box; }
.dh-categories-page { min-height: 100vh; overflow: hidden; background: var(--dh-color-bg-page); }
.dh-categories-page__container { width: 100%; max-width: 78rem; margin-inline: auto; }
.dh-categories-page h1,
.dh-categories-page h2,
.dh-categories-page p { margin: 0; }

.dh-categories-page__hero { padding: 4.5rem 6rem 4rem; background: var(--dh-color-bg-inverse); color: var(--dh-color-text-inverse); }
.dh-categories-page__hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) 18rem; align-items: end; gap: 4rem; }
.dh-categories-page__eyebrow { margin-bottom: 1rem !important; color: var(--dh-color-bg-status); font-family: 'Barlow Condensed', sans-serif; font-size: 0.875rem; font-weight: 600; letter-spacing: 0.075rem; text-transform: uppercase; }
.dh-categories-page__hero h1 { font-family: 'Barlow Condensed', sans-serif; font-size: clamp(4.5rem, 8vw, 7.5rem); font-weight: 900; line-height: 0.82; letter-spacing: -0.08rem; text-transform: uppercase; }
.dh-categories-page__hero h1 span { color: var(--dh-color-bg-accent); }
.dh-categories-page__intro { max-width: 42rem; margin-top: 1.75rem !important; color: #d8dcdf; font-size: 1.05rem; line-height: 1.65; }
.dh-categories-page__summary { min-height: 14rem; padding: 1.5rem; border: 1px solid #424950; border-top: 0.5rem solid var(--dh-color-bg-status); background: var(--dh-color-bg-surface-dark); }
.dh-categories-page__summary > span,
.dh-categories-page__summary > p { color: #aeb5bb; font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.075rem; text-transform: uppercase; }
.dh-categories-page__summary strong { display: block; margin: 1.25rem 0 0.25rem; font-family: 'Barlow Condensed', sans-serif; font-size: 4.5rem; line-height: 0.85; }
.dh-categories-page__summary div { display: flex; margin-top: 2rem; padding-top: 1rem; align-items: center; gap: 0.5rem; border-top: 1px solid #424950; font-size: 0.6875rem; text-transform: uppercase; }
.dh-categories-page__summary i { width: 0.5rem; height: 0.5rem; background: var(--dh-color-bg-status); }

.dh-categories-page__catalogue { padding: 5rem 6rem 6rem; }
.dh-categories-page__catalogue-header { display: flex; margin-bottom: 2rem; align-items: end; justify-content: space-between; gap: 2rem; }
.dh-categories-page__eyebrow--dark { color: var(--dh-color-bg-accent); }
.dh-categories-page__catalogue h2,
.dh-categories-page__guide h2 { font-family: 'Barlow Condensed', sans-serif; font-size: clamp(2.75rem, 5vw, 4rem); line-height: 0.95; text-transform: uppercase; }
.dh-categories-page__search { display: flex; width: min(100%, 22rem); flex-direction: column; gap: 0.5rem; color: var(--dh-color-text-secondary); font-family: 'Barlow Condensed', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06rem; text-transform: uppercase; }
.dh-categories-page__search input { width: 100%; height: 3.25rem; padding: 0 1rem; border: 1px solid var(--dh-color-border-strong); border-radius: 0; background: var(--dh-color-bg-surface); color: var(--dh-color-text-primary); outline: 0; }
.dh-categories-page__search input:focus-visible { outline: 3px solid var(--dh-color-bg-status); outline-offset: 3px; }
.dh-categories-page__search input::placeholder { color: #727a82; }

.dh-categories-page__filters { display: flex; margin-bottom: 2rem; overflow-x: auto; border: 1px solid var(--dh-color-border-strong); background: var(--dh-color-bg-surface); scrollbar-width: thin; }
.dh-categories-page__filters button { min-height: 3rem; padding: 0.75rem 1.25rem; flex: 1 0 auto; border: 0; border-right: 1px solid var(--dh-color-border-strong); border-radius: 0; background: transparent; font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04rem; text-transform: uppercase; cursor: pointer; }
.dh-categories-page__filters button:last-child { border-right: 0; }
.dh-categories-page__filters button:hover,
.dh-categories-page__filters button.is-active { background: var(--dh-color-bg-inverse); color: var(--dh-color-text-inverse); }
.dh-categories-page__filters button:focus-visible { position: relative; z-index: 1; outline: 3px solid var(--dh-color-bg-status); outline-offset: -3px; }

.dh-categories-page__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; }
.dh-category-card { position: relative; display: flex; min-height: 28rem; padding: 1.5rem; overflow: hidden; flex-direction: column; border: 1px solid var(--dh-color-border-strong); background: var(--dh-color-bg-surface); color: var(--dh-color-text-primary); text-decoration: none; transition: transform 180ms ease, box-shadow 180ms ease; }
.dh-category-card::before { position: absolute; top: 0; right: 0; width: 0.65rem; height: 6rem; background: var(--dh-color-bg-accent); content: ''; }
.dh-category-card--featured::before { height: 100%; background: var(--dh-color-bg-status); }
.dh-category-card:hover { z-index: 1; box-shadow: 0.75rem 0.75rem 0 var(--dh-color-bg-inverse); transform: translate(-0.25rem, -0.25rem); }
.dh-category-card:focus-visible { outline: 4px solid var(--dh-color-bg-status); outline-offset: 3px; }
.dh-category-card__topline { display: flex; min-height: 1.5rem; padding-right: 1rem; align-items: center; justify-content: space-between; gap: 1rem; color: var(--dh-color-text-secondary); font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.05rem; text-transform: uppercase; }
.dh-category-card__popular { padding: 0.3rem 0.5rem; background: var(--dh-color-bg-status); color: var(--dh-color-text-primary); }
.dh-category-card__identity { display: grid; grid-template-columns: 7.5rem minmax(0, 1fr); align-items: end; gap: 1.5rem; margin-top: 2rem; }
.dh-category-card__identity > strong { font-family: 'Barlow Condensed', sans-serif; font-size: clamp(4rem, 7vw, 6rem); font-weight: 900; line-height: 0.72; letter-spacing: -0.04rem; text-transform: uppercase; }
.dh-category-card__identity > span { display: flex; min-width: 0; flex-direction: column; gap: 0.35rem; }
.dh-category-card__identity b { font-family: 'Barlow Condensed', sans-serif; font-size: 1.5rem; line-height: 1; text-transform: uppercase; }
.dh-category-card__identity small { color: var(--dh-color-text-secondary); font-size: 0.625rem; font-weight: 600; text-transform: uppercase; }
.dh-category-card__description { max-width: 31rem; min-height: 4.5rem; margin-top: 2rem; color: var(--dh-color-text-secondary); font-size: 0.875rem; line-height: 1.55; }
.dh-category-card__metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: auto; border-block: 1px solid var(--dh-color-border-default); }
.dh-category-card__metrics > span { padding: 1rem 0; }
.dh-category-card__metrics > span + span { padding-left: 1.25rem; border-left: 1px solid var(--dh-color-border-default); }
.dh-category-card__metrics small { display: block; margin-bottom: 0.4rem; color: var(--dh-color-text-secondary); font-size: 0.625rem; font-weight: 600; letter-spacing: 0.04rem; text-transform: uppercase; }
.dh-category-card__metrics strong { display: flex; align-items: baseline; gap: 0.35rem; font-family: 'Barlow Condensed', sans-serif; font-size: 1.75rem; line-height: 1; text-transform: uppercase; }
.dh-category-card__metrics i { font-family: 'Inter', sans-serif; font-size: 0.625rem; font-style: normal; letter-spacing: 0.025rem; }
.dh-category-card__action { display: flex; padding-top: 1.25rem; align-items: center; justify-content: space-between; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04rem; text-transform: uppercase; }
.dh-category-card__action b { font-family: 'Barlow Condensed', sans-serif; font-size: 1.75rem; line-height: 1; transition: transform 180ms ease; }
.dh-category-card:hover .dh-category-card__action b { transform: translateX(0.4rem); }
.dh-categories-page__empty { display: flex; min-height: 20rem; padding: 3rem; align-items: center; justify-content: center; flex-direction: column; gap: 0.75rem; border: 1px solid var(--dh-color-border-strong); background: var(--dh-color-bg-surface); text-align: center; }
.dh-categories-page__empty strong { font-family: 'Barlow Condensed', sans-serif; font-size: 2rem; text-transform: uppercase; }
.dh-categories-page__empty button { margin-top: 0.75rem; border: 0; background: transparent; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; cursor: pointer; }

.dh-categories-page__guide { padding: 4rem 6rem; background: var(--dh-color-bg-status); }
.dh-categories-page__guide-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 2rem 5rem; }
.dh-categories-page__guide .dh-categories-page__eyebrow { color: var(--dh-color-text-primary); }
.dh-categories-page__guide-grid > p { max-width: 34rem; align-self: end; font-size: 0.875rem; line-height: 1.7; }
.dh-categories-page__age-note { grid-column: 2; padding-top: 1.25rem; border-top: 1px solid rgb(8 10 13 / 35%); font-size: 0.75rem !important; }

@media (max-width: 70rem) {
  .dh-categories-page__hero,
  .dh-categories-page__catalogue,
  .dh-categories-page__guide { padding-inline: 3rem; }
}

@media (max-width: 56rem) {
  .dh-categories-page__hero-grid { grid-template-columns: 1fr; }
  .dh-categories-page__summary { display: grid; min-height: auto; grid-template-columns: auto auto 1fr; align-items: end; gap: 0.75rem; }
  .dh-categories-page__summary strong { margin: 0; }
  .dh-categories-page__summary div { margin: 0; padding: 0; border: 0; justify-self: end; }
  .dh-category-card__identity { grid-template-columns: 6rem minmax(0, 1fr); }
  .dh-categories-page__guide-grid { grid-template-columns: 1fr; }
  .dh-categories-page__age-note { grid-column: 1; }
}

@media (max-width: 48rem) {
  .dh-categories-page__hero,
  .dh-categories-page__catalogue,
  .dh-categories-page__guide { padding-inline: 1.25rem; }
  .dh-categories-page__hero { padding-block: 3rem; }
  .dh-categories-page__catalogue { padding-block: 4rem; }
  .dh-categories-page__catalogue-header { align-items: flex-start; flex-direction: column; }
  .dh-categories-page__search { width: 100%; }
  .dh-categories-page__grid { grid-template-columns: 1fr; }
}

@media (max-width: 34rem) {
  .dh-categories-page__summary { grid-template-columns: auto 1fr; }
  .dh-categories-page__summary > span,
  .dh-categories-page__summary div { grid-column: 1 / -1; justify-self: start; }
  .dh-category-card { min-height: 30rem; padding: 1.25rem; }
  .dh-category-card__identity { grid-template-columns: 1fr; align-items: start; gap: 1rem; }
  .dh-category-card__description { margin-top: 1.5rem; }
}

@media (prefers-reduced-motion: reduce) {
  .dh-category-card,
  .dh-category-card__action b { transition: none; }
}
</style>
