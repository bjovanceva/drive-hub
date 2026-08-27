<script lang="ts" setup>
import ctaRace from '~/assets/cta-race.svg'
import heroTrack from '~/assets/hero-track.svg'
import timingRail from '~/assets/timing-rail.svg'
import { defaultHomePageData } from '~/data/home'
import type { HomeSearchPresentationDto, SelectOptionPresentationDto } from '~/types/presentation/home'

definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Home | Drive Hub',
  description: 'Compare verified driving schools, licence programmes, instructors, and vehicles across North Macedonia.'
})

const route = useRoute()
const pageData = defaultHomePageData

const { data: schools, error, status } = await useFetch('/api/driving-schools')

function validQueryValue(
  value: unknown,
  options: SelectOptionPresentationDto[],
  fallback: string
) {
  return typeof value === 'string' && options.some(option => option.value === value)
    ? value
    : fallback
}

const searchData = computed<HomeSearchPresentationDto>(() => ({
  ...pageData.hero.search,
  defaultLocation: validQueryValue(
    route.query.location,
    pageData.hero.search.locations,
    pageData.hero.search.defaultLocation
  ),
  defaultCategory: validQueryValue(
    route.query.category,
    pageData.hero.search.categories,
    pageData.hero.search.defaultCategory
  )
}))

function handleSearch(filters: { location: string, category: string }) {
  void navigateTo({
    path: route.path,
    query: {
      ...route.query,
      location: filters.location,
      category: filters.category
    }
  })
}
</script>

<template>
  <div id="top" class="dh-home">
    <section class="dh-home__hero" aria-labelledby="home-title">
      <div class="dh-home__container">
        <div class="dh-home__hero-main">
          <div class="dh-home__hero-copy">
            <p class="dh-home__eyebrow dh-home__eyebrow--status">
              {{ pageData.hero.eyebrow }}
            </p>

            <h1 id="home-title">
              <span v-for="line in pageData.hero.titleLines" :key="line">{{ line }}</span>
            </h1>

            <p class="dh-home__hero-description">
              {{ pageData.hero.description }}
            </p>

            <p class="dh-home__proof">
              <span aria-hidden="true" />
              {{ pageData.hero.proof }}
            </p>
          </div>

          <img
            class="dh-home__hero-track"
            :src="heroTrack"
            alt=""
            width="448"
            height="382"
          >
        </div>

        <SearchPanel :data="searchData" @search="handleSearch" />
      </div>
    </section>

    <section class="dh-home__section dh-home__section--page" aria-labelledby="network-heading">
      <div class="dh-home__container">
        <SectionHeading
          id="network-heading"
          :eyebrow="pageData.network.eyebrow"
          :title="pageData.network.title"
          :description="pageData.network.description"
        />

        <div class="dh-home__stats">
          <StatTile
            v-for="stat in pageData.network.stats"
            :key="stat.id"
            :value="stat.value"
            :label="stat.label"
            :meta="stat.meta"
          />
        </div>
      </div>
    </section>

    <section id="schools" class="dh-home__section dh-home__section--surface" aria-labelledby="schools-heading">
      <div class="dh-home__container">
        <SectionHeading
          id="schools-heading"
          :eyebrow="pageData.featuredSchools.eyebrow"
          :title="pageData.featuredSchools.title"
          :action-label="pageData.featuredSchools.actionLabel"
          :action-to="pageData.featuredSchools.actionTo"
        />

        <div class="dh-home__schools">
          <div
            v-for="(school, schoolIndex) in schools"
            :id="String(school.id)"
            :key="school.id"
          >
            <SchoolCard
              :school-name="school.name"
              :location="school.address"
              licence-type="B"
              price="25000"
              :verified="true"
              to="happy"
              :reveal-delay="schoolIndex * 120"
            />
          </div>
        </div>
      </div>
    </section>

    <section id="licences" class="dh-home__section dh-home__section--inverse" aria-labelledby="licences-heading">
      <div class="dh-home__container">
        <SectionHeading
          id="licences-heading"
          theme="dark"
          :eyebrow="pageData.licenceCategories.eyebrow"
          :title="pageData.licenceCategories.title"
          :description="pageData.licenceCategories.description"
        />

        <img class="dh-home__timing-rail" :src="timingRail" alt="" width="1248" height="20">

        <div class="dh-home__categories">
          <div
            v-for="(category, categoryIndex) in pageData.licenceCategories.categories"
            :id="category.id"
            :key="category.id"
          >
            <CategoryTile
              :code="category.code"
              :label="category.label"
              :meta="category.meta"
              :to="category.to"
              :reveal-delay="categoryIndex * 110"
            />
          </div>
        </div>
      </div>
    </section>

    <section id="how-it-works" class="dh-home__section dh-home__section--page" aria-labelledby="journey-heading">
      <div class="dh-home__container">
        <SectionHeading
          id="journey-heading"
          :eyebrow="pageData.journey.eyebrow"
          :title="pageData.journey.title"
          :description="pageData.journey.description"
        />

        <JourneyBoard :steps="pageData.journey.steps" />
      </div>
    </section>

    <section id="apply" class="dh-home__cta" aria-labelledby="cta-heading">
      <div class="dh-home__container dh-home__cta-inner">
        <div class="dh-home__cta-copy">
          <p class="dh-home__eyebrow dh-home__eyebrow--status">
            {{ pageData.finalCta.eyebrow }}
          </p>
          <h2 id="cta-heading">{{ pageData.finalCta.title }}</h2>
          <p>{{ pageData.finalCta.description }}</p>
          <AppButton
            variant="secondary"
            :text="pageData.finalCta.actionLabel"
            :to="pageData.finalCta.actionTo"
          />
        </div>

        <img class="dh-home__cta-track" :src="ctaRace" alt="" width="452" height="244">
      </div>
    </section>
  </div>
</template>

<style scoped>
.dh-home {
  --dh-color-bg-page: #f1f3f2;
  --dh-color-bg-inverse: #080a0d;
  --dh-color-bg-surface: #ffffff;
  --dh-color-bg-surface-dark: #11151a;
  --dh-color-bg-accent: #e8452e;
  --dh-color-bg-accent-hover: #c93624;
  --dh-color-bg-status: #c9f24d;
  --dh-color-text-primary: #080a0d;
  --dh-color-text-secondary: #3c454f;
  --dh-color-text-inverse: #ffffff;
  --dh-color-border-default: #c8ced4;
  --dh-color-border-strong: #080a0d;
  --dh-steel-300: #c8ced4;
  --dh-radius-none: 0;
  --dh-stroke-thin: 1px;
  --dh-space-4: 1rem;
  --dh-space-6: 1.5rem;

  width: 100%;
  overflow: hidden;
  background: var(--dh-color-bg-page);
}

.dh-home,
.dh-home * {
  box-sizing: border-box;
}

.dh-home__container {
  width: 100%;
  max-width: 78rem;
  margin-inline: auto;
}

.dh-home__hero {
  padding: 4.5rem 6rem 5rem;
  background: var(--dh-color-bg-inverse);
  color: var(--dh-color-text-inverse);
}

.dh-home__hero-main {
  display: grid;
  min-height: 23.875rem;
  grid-template-columns: minmax(0, 47.5rem) 28rem;
  align-items: center;
  gap: 2.5rem;
  margin-bottom: 2.5rem;
}

.dh-home__hero-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.375rem;
}

.dh-home__eyebrow,
.dh-home__hero h1,
.dh-home__hero-description,
.dh-home__proof,
.dh-home__cta h2,
.dh-home__cta p {
  margin: 0;
}

.dh-home__eyebrow {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1rem;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-home__eyebrow--status {
  color: var(--dh-color-bg-status);
}

.dh-home__hero h1 {
  display: flex;
  flex-direction: column;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(4.75rem, 7vw, 6rem);
  font-weight: 900;
  line-height: 0.9167;
  letter-spacing: -0.075rem;
  text-transform: uppercase;
}

.dh-home__hero-description {
  width: 40.625rem;
  max-width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.dh-home__proof {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
  letter-spacing: 0.025rem;
  text-transform: uppercase;
}

.dh-home__proof span {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--dh-color-bg-status);
}

.dh-home__hero-track {
  display: block;
  width: 28rem;
  height: 23.875rem;
  object-fit: fill;
}

.dh-home__section {
  padding: 5.5rem 6rem 6rem;
}

.dh-home__section .dh-home__container {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.dh-home__section--page {
  background: var(--dh-color-bg-page);
}

.dh-home__section--surface {
  border-block: 1px solid var(--dh-color-border-default);
  background: var(--dh-color-bg-surface);
}

.dh-home__section--inverse {
  background: var(--dh-color-bg-inverse);
}

.dh-home__stats,
.dh-home__schools,
.dh-home__categories {
  display: grid;
  grid-template-columns: repeat(3, 21.5rem);
  justify-content: space-between;
  gap: 2rem;
}

.dh-home__schools > div,
.dh-home__categories > div {
  min-width: 0;
}

.dh-home__timing-rail {
  display: block;
  width: 100%;
  height: 1.25rem;
  object-fit: fill;
}

.dh-home__cta {
  min-height: 22.25rem;
  padding: 3.5rem 6rem;
  background: var(--dh-color-bg-accent);
  color: var(--dh-color-text-inverse);
}

.dh-home__cta-inner {
  display: grid;
  grid-template-columns: minmax(0, 46.25rem) 28.25rem;
  align-items: center;
  gap: 3.5rem;
}

.dh-home__cta-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.125rem;
}

.dh-home__cta h2 {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(2.75rem, 4vw, 3.5rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.025rem;
  text-transform: uppercase;
}

.dh-home__cta-copy > p:not(.dh-home__eyebrow) {
  width: 40.625rem;
  max-width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.dh-home__cta-track {
  display: block;
  width: 28.25rem;
  height: 15.25rem;
  object-fit: fill;
}

@media (max-width: 75rem) {
  .dh-home__hero,
  .dh-home__section,
  .dh-home__cta {
    padding-inline: 3rem;
  }

  .dh-home__hero-main,
  .dh-home__cta-inner {
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 35%);
  }

  .dh-home__hero-track,
  .dh-home__cta-track {
    width: 100%;
  }

  .dh-home__stats,
  .dh-home__schools,
  .dh-home__categories {
    grid-template-columns: repeat(3, minmax(0, 21.5rem));
  }
}

@media (max-width: 62rem) {
  .dh-home__hero-main,
  .dh-home__cta-inner {
    grid-template-columns: 1fr;
  }

  .dh-home__hero-track,
  .dh-home__cta-track {
    width: 100%;
    max-width: 28rem;
    height: auto;
  }

  .dh-home__hero-track {
    justify-self: end;
  }

  .dh-home__stats,
  .dh-home__schools,
  .dh-home__categories {
    grid-template-columns: repeat(2, minmax(0, 21.5rem));
    justify-content: start;
  }
}

@media (max-width: 48rem) {
  .dh-home__hero,
  .dh-home__section,
  .dh-home__cta {
    padding-inline: 1.25rem;
  }

  .dh-home__hero {
    padding-block: 3rem;
  }

  .dh-home__section {
    padding-block: 4rem;
  }

  .dh-home__cta {
    padding-block: 3rem;
  }

  .dh-home__hero h1 {
    font-size: clamp(3.5rem, 16vw, 5rem);
  }

  .dh-home__stats,
  .dh-home__schools,
  .dh-home__categories {
    grid-template-columns: minmax(0, 21.5rem);
  }
}

@media (max-width: 24rem) {
  .dh-home__stats,
  .dh-home__schools,
  .dh-home__categories {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
