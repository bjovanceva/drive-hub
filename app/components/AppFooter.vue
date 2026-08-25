<script lang="ts" setup>
import driveHubLogo from '~/assets/Drive-Hub-Logo.svg'

const currentYear = new Date().getFullYear()

const linkGroups = [
  {
    title: 'Explore',
    links: [
      { label: 'Driving schools', to: '#schools' },
      { label: 'Licence categories', to: '#licences' },
      { label: 'Instructors', to: '#instructors' }
    ]
  },
  {
    title: 'Drive Hub',
    links: [
      { label: 'How it works', to: '#how-it-works' },
      { label: 'For schools', to: '#for-schools' },
      { label: 'Support', to: '#support' }
    ]
  }
]

const legalLinks = [
  { label: 'Privacy', to: '#privacy' },
  { label: 'Terms', to: '#terms' },
  { label: 'Accessibility', to: '#accessibility' }
]
</script>

<template>
  <footer class="dh-footer" data-node-id="35:135">
    <div class="dh-footer__top">
      <div class="dh-footer__brand-column">
        <NuxtLink class="dh-footer__brand" to="/" aria-label="Drive Hub home">
          <img
            class="dh-footer__logo"
            :src="driveHubLogo"
            alt=""
            width="32"
            height="28"
          >
          <span>Drive / Hub</span>
        </NuxtLink>

        <p class="dh-footer__tagline">
          The focused marketplace for driving schools, learners, instructors, and the road ahead.
        </p>
      </div>

      <div class="dh-footer__links">
        <nav
          v-for="group in linkGroups"
          :key="group.title"
          class="dh-footer__link-group"
          :aria-label="`${group.title} footer links`"
        >
          <h2>{{ group.title }}</h2>
          <NuxtLink
            v-for="link in group.links"
            :key="link.label"
            :to="link.to"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
    </div>

    <div class="dh-footer__divider" />

    <div class="dh-footer__bottom">
      <p>© {{ currentYear }} Drive Hub · North Macedonia</p>

      <nav class="dh-footer__legal" aria-label="Legal links">
        <template v-for="(link, index) in legalLinks" :key="link.label">
          <span v-if="index" aria-hidden="true">·</span>
          <NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
        </template>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.dh-footer,
.dh-footer * {
  box-sizing: border-box;
}

.dh-footer {
  display: flex;
  width: 100%;
  min-height: 19.0625rem;
  flex-direction: column;
  gap: 2.5rem;
  padding: 3.5rem 6rem 2.25rem;
  background: var(--dh-color-bg-inverse, #080a0d);
  color: var(--dh-color-text-inverse, #ffffff);
}

.dh-footer a {
  color: inherit;
  text-decoration: none;
}

.dh-footer__top,
.dh-footer__divider,
.dh-footer__bottom {
  width: 100%;
  max-width: 78rem;
  margin-inline: auto;
}

.dh-footer__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 3rem;
}

.dh-footer__brand-column {
  display: flex;
  width: 31.25rem;
  max-width: 100%;
  flex-direction: column;
  gap: 0.875rem;
}

.dh-footer__brand {
  display: inline-flex;
  width: max-content;
  align-items: center;
  gap: 0.75rem;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 2rem;
  text-transform: uppercase;
}

.dh-footer__logo {
  display: block;
  width: 2rem;
  height: 1.75rem;
}

.dh-footer__tagline {
  width: 29.375rem;
  max-width: 100%;
  margin: 0;
  color: var(--dh-steel-300, #c8ced4);
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5rem;
}

.dh-footer__links {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  gap: 5rem;
}

.dh-footer__link-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.dh-footer__link-group h2 {
  margin: 0;
  color: var(--dh-color-bg-status, #c9f24d);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1rem;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-footer__link-group a {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
  letter-spacing: 0.00625rem;
  text-transform: uppercase;
  white-space: nowrap;
  transition: color 160ms ease;
}

.dh-footer__link-group a:hover,
.dh-footer__legal a:hover {
  color: var(--dh-color-bg-status, #c9f24d);
}

.dh-footer a:focus-visible {
  outline: 2px solid var(--dh-color-bg-status, #c9f24d);
  outline-offset: 4px;
}

.dh-footer__divider {
  height: 1px;
  flex: 0 0 1px;
  background: var(--dh-color-border-strong, #3c454f);
}

.dh-footer__bottom {
  display: flex;
  min-height: 1.25rem;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  color: var(--dh-steel-300, #c8ced4);
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
  letter-spacing: 0.025rem;
  text-transform: uppercase;
}

.dh-footer__bottom p {
  margin: 0;
}

.dh-footer__legal {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

@media (max-width: 52rem) {
  .dh-footer {
    padding: 3rem 2rem 2rem;
  }

  .dh-footer__top {
    flex-direction: column;
  }

  .dh-footer__links {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 34rem) {
  .dh-footer {
    gap: 2rem;
    padding: 2.5rem 1.25rem 1.75rem;
  }

  .dh-footer__links {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem;
  }

  .dh-footer__bottom {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.75rem;
  }

  .dh-footer__legal {
    flex-wrap: wrap;
  }
}
</style>
