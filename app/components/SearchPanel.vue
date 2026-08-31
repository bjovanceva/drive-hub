<script lang="ts" setup>
import type { SchoolSearchPresentationDto } from '~/types/presentation/home'

const props = defineProps<{
  data: SchoolSearchPresentationDto
}>()

const emit = defineEmits<{
  search: [filters: { location: string, category: string }]
}>()

const location = ref(props.data.defaultLocation)
const category = ref(props.data.defaultCategory)

watch(() => props.data.defaultLocation, value => {
  location.value = value
})

watch(() => props.data.defaultCategory, value => {
  category.value = value
})

function submitSearch() {
  emit('search', {
    location: location.value,
    category: category.value
  })
}
</script>

<template>
  <form class="dh-search-panel" data-node-id="20:2" @submit.prevent="submitSearch">
    <label class="dh-search-panel__field">
      <span class="dh-search-panel__label"><span>Location</span><small>Select city</small></span>
      <span class="dh-search-panel__select-wrap">
        <select v-model="location" name="location">
          <option v-for="option in data.locations" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <span class="dh-search-panel__chevron" aria-hidden="true">⌄</span>
      </span>
    </label>

    <span class="dh-search-panel__divider" aria-hidden="true" />

    <label class="dh-search-panel__field dh-search-panel__field--category">
      <span class="dh-search-panel__label"><span>Licence category</span><small>Select class</small></span>
      <span class="dh-search-panel__select-wrap">
        <select v-model="category" name="category">
          <option v-for="option in data.categories" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <span class="dh-search-panel__chevron" aria-hidden="true">⌄</span>
      </span>
    </label>

    <span class="dh-search-panel__spacer" aria-hidden="true" />
    <AppButton :text="data.submitLabel" type="submit" />
  </form>
</template>

<style scoped>
.dh-search-panel {
  display: flex;
  width: 100%;
  min-height: 6.5rem;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border: var(--dh-stroke-thin, 1px) solid var(--dh-color-border-strong, #080a0d);
  border-radius: var(--dh-radius-none, 0);
  background: var(--dh-color-bg-surface, #ffffff);
}

.dh-search-panel__field {
  display: flex;
  width: 16.25rem;
  flex: 0 1 16.25rem;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--dh-color-text-secondary, #3c454f);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1rem;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-search-panel__label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.dh-search-panel__label small {
  color: #68727d;
  font-family: 'Inter', sans-serif;
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.025rem;
}

.dh-search-panel__field--category {
  width: 20.625rem;
  flex-basis: 20.625rem;
}

.dh-search-panel__select-wrap {
  position: relative;
  display: block;
}

.dh-search-panel select {
  width: 100%;
  min-height: 3.5rem;
  padding: 0.625rem 3.25rem 0.625rem 0.875rem;
  border: 1px solid var(--dh-color-border-strong, #080a0d);
  border-radius: 0;
  outline: 0;
  appearance: none;
  background: var(--dh-color-bg-page, #f1f3f2);
  color: var(--dh-color-text-primary, #080a0d);
  font: inherit;
  font-size: 1.75rem;
  line-height: 2rem;
  text-transform: uppercase;
  cursor: pointer;
}

.dh-search-panel__chevron {
  position: absolute;
  top: 50%;
  right: 0;
  display: grid;
  width: 2.75rem;
  height: calc(100% - 2px);
  border-left: 1px solid var(--dh-color-border-strong, #080a0d);
  border-right: 1px solid var(--dh-color-border-strong, #080a0d);
  background: var(--dh-color-bg-status, #c9f24d);
  color: var(--dh-color-text-primary, #080a0d);
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  line-height: 1;
  place-items: center;
  pointer-events: none;
  transform: translateY(-50%);
}

.dh-search-panel select:focus-visible {
  outline: 3px solid var(--dh-color-bg-status, #c9f24d);
  outline-offset: 3px;
}

.dh-search-panel__divider {
  width: 1px;
  height: 3.5rem;
  flex: 0 0 1px;
  background: var(--dh-color-border-default, #c8ced4);
}

.dh-search-panel__spacer {
  flex: 1 1 auto;
}

@media (max-width: 56rem) {
  .dh-search-panel {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .dh-search-panel__field,
  .dh-search-panel__field--category {
    width: calc(50% - 0.75rem);
    flex: 1 1 16rem;
  }

  .dh-search-panel__spacer,
  .dh-search-panel__divider {
    display: none;
  }
}

@media (max-width: 34rem) {
  .dh-search-panel__field,
  .dh-search-panel__field--category {
    width: 100%;
    flex-basis: 100%;
  }

  .dh-search-panel :deep(.dh-button) {
    width: 100%;
  }
}
</style>
