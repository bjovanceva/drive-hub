<script lang="ts" setup>
import type { SchoolDirectoryItemDto } from '~/types/presentation/schools'

defineProps<{ school: SchoolDirectoryItemDto, position: number }>()

/** Makes legacy slug-like city values readable while preserving DB labels. */
function formatCity(city: string) {
  return city
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** A zero price means the school has not published a programme price yet. */
function formatPrice(value: number) {
  return value > 0 ? `${new Intl.NumberFormat('en-US').format(value)} MKD` : 'Contact school'
}
</script>

<template>
  <article class="dh-directory-card">
    <div class="dh-directory-card__gridline" aria-hidden="true">
      <span>{{ String(position).padStart(2, '0') }}</span>
      <span>{{ formatCity(school.city) }}</span>
    </div>

    <div class="dh-directory-card__body">
      <div class="dh-directory-card__status-row">
        <span v-if="school.verified" class="dh-directory-card__verified"><i aria-hidden="true" /> Verified</span>
        <span class="dh-directory-card__availability" :class="`dh-directory-card__availability--${school.availability}`">
          {{ school.availability === 'open' ? 'Enrolling now' : 'Limited places' }}
        </span>
      </div>

      <div class="dh-directory-card__title-row">
        <div>
          <h2>{{ school.name }}</h2>
          <p>{{ formatCity(school.city) }} · {{ school.municipality }}</p>
        </div>
        <p v-if="school.reviewCount" class="dh-directory-card__rating" :aria-label="`${school.rating} out of 5, ${school.reviewCount} reviews`">
          <span aria-hidden="true">★</span> {{ school.rating }}
          <small>{{ school.reviewCount }} reviews</small>
        </p>
        <p v-else class="dh-directory-card__rating">New listing</p>
      </div>

      <div class="dh-directory-card__categories" aria-label="Available licence categories">
        <span v-for="item in school.categories" :key="item">Category {{ item.toUpperCase() }}</span>
      </div>

      <dl class="dh-directory-card__details">
        <div><dt>Programme from</dt><dd>{{ formatPrice(school.priceFrom) }}</dd></div>
        <div><dt>Next group</dt><dd>{{ school.nextStart }}</dd></div>
      </dl>

      <div class="dh-directory-card__footer">
        <p>{{ school.vehicles }} · {{ school.languages.join(' / ') }}</p>
        <NuxtLink to="/start-application">Start application →</NuxtLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.dh-directory-card,
.dh-directory-card * { box-sizing: border-box; }

.dh-directory-card {
  display: flex;
  min-width: 0;
  min-height: 29rem;
  flex-direction: column;
  border: 1px solid var(--dh-color-border-strong);
  background: var(--dh-color-bg-surface);
  transition: box-shadow 180ms ease, transform 180ms ease;
}

.dh-directory-card:hover {
  box-shadow: 0.5rem 0.5rem 0 var(--dh-color-bg-status);
  transform: translate(-0.25rem, -0.25rem);
}

.dh-directory-card__gridline {
  display: flex;
  min-height: 4.5rem;
  padding: 1rem 1.25rem;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, transparent 47%, #ffffff14 47% 53%, transparent 53%) 0 0 / 1rem 1rem, var(--dh-color-bg-inverse);
  color: var(--dh-color-text-inverse);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-directory-card__gridline span:first-child {
  color: var(--dh-color-bg-status);
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
}

.dh-directory-card__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
}

.dh-directory-card__status-row,
.dh-directory-card__title-row,
.dh-directory-card__footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.dh-directory-card__verified,
.dh-directory-card__availability {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04rem;
  text-transform: uppercase;
}

.dh-directory-card__verified { display: inline-flex; align-items: center; gap: 0.45rem; }
.dh-directory-card__verified i { width: 0.5rem; height: 0.5rem; background: var(--dh-color-bg-status); }
.dh-directory-card__availability { padding: 0.35rem 0.5rem; background: #e7f0e0; color: #264f16; }
.dh-directory-card__availability--limited { background: #fff0dc; color: #7a3e00; }

.dh-directory-card h2,
.dh-directory-card p,
.dh-directory-card dl,
.dh-directory-card dd { margin: 0; }

.dh-directory-card h2 {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 2rem;
  line-height: 1;
  text-transform: uppercase;
}

.dh-directory-card__title-row > div > p {
  margin-top: 0.5rem;
  color: var(--dh-color-text-secondary);
  font-size: 0.8125rem;
  text-transform: uppercase;
}

.dh-directory-card__rating { flex: 0 0 auto; text-align: right; font-weight: 600; }
.dh-directory-card__rating > span { color: var(--dh-color-bg-accent); }
.dh-directory-card__rating small { display: block; margin-top: 0.25rem; color: var(--dh-color-text-secondary); font-size: 0.6875rem; font-weight: 500; }

.dh-directory-card__categories { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.dh-directory-card__categories span { padding: 0.5rem 0.625rem; border: 1px solid var(--dh-color-border-strong); font-family: 'Barlow Condensed', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05rem; text-transform: uppercase; }

.dh-directory-card__details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-block: 1px solid var(--dh-color-border-default); }
.dh-directory-card__details div { padding: 1rem 0; }
.dh-directory-card__details div + div { padding-left: 1rem; border-left: 1px solid var(--dh-color-border-default); }
.dh-directory-card__details dt { margin-bottom: 0.35rem; color: var(--dh-color-text-secondary); font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04rem; text-transform: uppercase; }
.dh-directory-card__details dd { font-family: 'Barlow Condensed', sans-serif; font-size: 1.25rem; font-weight: 700; text-transform: uppercase; }

.dh-directory-card__footer { margin-top: auto; align-items: flex-end; }
.dh-directory-card__footer p { max-width: 13rem; color: var(--dh-color-text-secondary); font-size: 0.75rem; line-height: 1.35; text-transform: uppercase; }
.dh-directory-card__footer a { color: var(--dh-color-text-primary); font-size: 0.75rem; font-weight: 600; text-decoration: none; text-transform: uppercase; white-space: nowrap; }
.dh-directory-card__footer a:hover { color: var(--dh-color-bg-accent); }
.dh-directory-card__footer a:focus-visible { outline: 2px solid var(--dh-color-bg-status); outline-offset: 3px; }

@media (max-width: 32rem) {
  .dh-directory-card__title-row,
  .dh-directory-card__footer { align-items: flex-start; flex-direction: column; }
  .dh-directory-card__rating { text-align: left; }
}
</style>
