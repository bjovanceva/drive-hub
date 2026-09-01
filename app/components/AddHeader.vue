<script lang="ts" setup>
import driveHubLogo from '~/assets/Drive-Hub-Logo.svg'
import HeaderNavLink from '~/components/HeaderNavLink.vue'

type HeaderLink = {
  label: string
  to: string
}

const props = withDefaults(defineProps<{
  navigation?: HeaderLink[]
  signInTo?: string
  applicationTo?: string
}>(), {
  navigation: () => [
    { label: 'Schools', to: '/schools' },
    { label: 'Categories', to: '/categories' },
    { label: 'How it works', to: '/#how-it-works' }
  ],
  signInTo: '#sign-in',
  applicationTo: '/#apply'
})

const route = useRoute()
const isMenuOpen = ref(false)

function closeMenu() {
  isMenuOpen.value = false
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

// Close the mobile drawer after every navigation, including query-only route
// changes made by directory filters.
watch(() => route.fullPath, closeMenu)
</script>

<template>
  <header class="dh-header" data-node-id="29:3">
    <NuxtLink class="dh-header__brand" to="/" aria-label="Drive Hub home" @click="closeMenu">
      <img
        class="dh-header__logo"
        :src="driveHubLogo"
        alt=""
        width="32"
        height="28"
      >
      <span>Drive / Hub</span>
    </NuxtLink>

    <div
      id="drive-hub-header-menu"
      class="dh-header__menu"
      :class="{ 'dh-header__menu--open': isMenuOpen }"
    >
      <nav class="dh-header__navigation" aria-label="Primary navigation">
        <HeaderNavLink
          v-for="item in props.navigation"
          :key="item.label"
          :label="item.label"
          :to="item.to"
          @click="closeMenu"
        />
      </nav>

      <span class="dh-header__spacer" aria-hidden="true" />

      <HeaderNavLink
        class="dh-header__sign-in"
        label="Sign in"
        :to="props.signInTo"
        @click="closeMenu"
      />

      <NuxtLink class="dh-header__application" :to="props.applicationTo" @click="closeMenu">
        Start application →
      </NuxtLink>
    </div>

    <button
      class="dh-header__menu-toggle"
      type="button"
      :aria-expanded="isMenuOpen"
      aria-controls="drive-hub-header-menu"
      :aria-label="isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'"
      @click="toggleMenu"
    >
      <span class="dh-header__menu-icon" :class="{ 'dh-header__menu-icon--open': isMenuOpen }" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span class="dh-header__menu-label">Menu</span>
    </button>
  </header>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
}

.dh-header {
  --dh-color-bg-inverse: #080a0d;
  --dh-color-bg-surface: #ffffff;
  --dh-color-border-strong: #080a0d;
  --dh-color-text-primary: #080a0d;
  --dh-color-text-inverse: #ffffff;
  --dh-color-text-hover: #c9f24d;

  position: relative;
  z-index: 50;
  display: flex;
  width: 100%;
  min-height: 5rem;
  padding: 0 6rem;
  align-items: center;
  gap: 2rem;
  border-bottom: 1px solid var(--dh-color-border-strong);
  background: var(--dh-color-bg-inverse);
  color: var(--dh-color-text-inverse);
}

.dh-header__menu {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: 2rem;
}

.dh-header a {
  color: inherit;
  text-decoration: none;
}

.dh-header__brand {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.75rem;
  min-width: max-content;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1rem;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-header__logo {
  display: block;
  width: 2rem;
  height: 1.75rem;
}

.dh-header__navigation {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 1.75rem;
}

.dh-header__application {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
  letter-spacing: 0.00625rem;
  text-transform: uppercase;
  white-space: nowrap;
}

.dh-header__application:focus-visible,
.dh-header__brand:focus-visible {
  outline: 2px solid var(--dh-color-text-hover);
  outline-offset: 4px;
}

.dh-header__spacer {
  flex: 1 1 auto;
  min-width: 1px;
}

.dh-header__sign-in {
  flex: 0 0 auto;
}

.dh-header__application {
  display: inline-flex;
  width: 13.5rem;
  height: 3.25rem;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.5rem;
  border: 1px solid var(--dh-color-border-strong);
  border-radius: 0;
  background: var(--dh-color-bg-surface);
  color: var(--dh-color-text-primary) !important;
  transition: background-color 160ms ease, color 160ms ease;
}

.dh-header__application:hover {
  background: var(--dh-color-text-hover);
}

.dh-header__menu-toggle {
  display: none;
  border-radius: 0;
}

@media (max-width: 70rem) {
  .dh-header {
    padding-inline: 2rem;
    gap: 1.5rem;
  }

  .dh-header__menu {
    gap: 1.5rem;
  }

  .dh-header__navigation {
    gap: 1.125rem;
  }

  .dh-header__application {
    width: 11.875rem;
  }
}

@media (max-width: 52rem) {
  .dh-header {
    min-height: 5rem;
    padding: 0.875rem 1.25rem;
    justify-content: space-between;
    gap: 1rem;
  }

  .dh-header__menu {
    position: absolute;
    z-index: 1;
    top: 100%;
    right: 0;
    left: 0;
    display: flex;
    max-height: 0;
    padding: 0 1.25rem;
    overflow: hidden;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    border-top: 1px solid #3c454f;
    border-bottom: 2px solid var(--dh-color-text-hover);
    background: var(--dh-color-bg-inverse);
    box-shadow: 0 1rem 2rem rgb(0 0 0 / 28%);
    opacity: 0;
    pointer-events: none;
    transform: translate3d(0, -0.75rem, 0);
    visibility: hidden;
    transition:
      max-height 360ms cubic-bezier(0.16, 1, 0.3, 1),
      padding 360ms cubic-bezier(0.16, 1, 0.3, 1),
      opacity 180ms ease,
      transform 280ms cubic-bezier(0.16, 1, 0.3, 1),
      visibility 0s linear 360ms;
  }

  .dh-header__menu::after {
    position: absolute;
    right: 1.25rem;
    bottom: 0.75rem;
    width: 4rem;
    height: 0.25rem;
    background: var(--dh-color-text-hover);
    clip-path: polygon(8% 0, 100% 0, 92% 100%, 0 100%);
    content: '';
  }

  .dh-header__menu--open {
    max-height: calc(100vh - 5rem);
    padding-block: 1.5rem 2.25rem;
    overflow-y: auto;
    opacity: 1;
    pointer-events: auto;
    transform: translate3d(0, 0, 0);
    visibility: visible;
    transition-delay: 0s;
  }

  .dh-header__navigation {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    padding: 0 0 1rem;
    border-bottom: 1px solid #3c454f;
  }

  .dh-header__navigation :deep(.dh-header-link),
  .dh-header__sign-in {
    width: 100%;
    min-height: 3rem;
    justify-content: center;
    text-align: center;
  }

  .dh-header__spacer {
    display: none;
  }

  .dh-header__sign-in {
    margin-block: 0.5rem;
  }

  .dh-header__application {
    width: 100%;
    height: 3rem;
    padding: 0.75rem 1rem;
  }

  .dh-header__menu-toggle {
    display: inline-flex;
    min-width: 5.25rem;
    height: 2.75rem;
    padding: 0 0.75rem;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    border: 1px solid #3c454f;
    background: transparent;
    color: var(--dh-color-text-inverse);
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05rem;
    text-transform: uppercase;
  }

  .dh-header__menu-toggle:hover,
  .dh-header__menu-toggle:focus-visible {
    border-color: var(--dh-color-text-hover);
    color: var(--dh-color-text-hover);
  }

  .dh-header__menu-toggle:focus-visible {
    outline: 2px solid var(--dh-color-text-hover);
    outline-offset: 3px;
  }

  .dh-header__menu-icon {
    position: relative;
    display: block;
    width: 1.125rem;
    height: 0.875rem;
  }

  .dh-header__menu-icon span {
    position: absolute;
    left: 0;
    display: block;
    width: 100%;
    height: 2px;
    background: currentColor;
    transition: opacity 160ms ease, transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .dh-header__menu-icon span:nth-child(1) {
    top: 0;
  }

  .dh-header__menu-icon span:nth-child(2) {
    top: 0.375rem;
  }

  .dh-header__menu-icon span:nth-child(3) {
    top: 0.75rem;
  }

  .dh-header__menu-icon--open span:nth-child(1) {
    transform: translateY(0.375rem) rotate(45deg);
  }

  .dh-header__menu-icon--open span:nth-child(2) {
    opacity: 0;
    transform: translateX(-0.375rem);
  }

  .dh-header__menu-icon--open span:nth-child(3) {
    transform: translateY(-0.375rem) rotate(-45deg);
  }
}

@media (max-width: 34rem) {
  .dh-header {
    column-gap: 0.75rem;
  }

  .dh-header__brand span {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dh-header__menu,
  .dh-header__menu-icon span {
    transition: none;
  }
}
</style>
