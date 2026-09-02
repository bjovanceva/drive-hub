<script lang="ts" setup>
import { schoolRoutes } from '#shared/constants/routes'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const schoolId = computed(() => Number(route.params.id))
const selectedCategoryId = ref<number | null>(null)
const formError = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

const { data: categories, status: categoriesStatus } = await useFetch<Array<{ id: number, name: string, code: string | null }>>('/api/categories')

async function submitCategory() {
  formError.value = ''
  successMessage.value = ''

  if (!Number.isInteger(selectedCategoryId.value) || selectedCategoryId.value! <= 0) {
    formError.value = 'Please select a category to add.'
    return
  }

  isSubmitting.value = true

  try {
    await $fetch(`/api/driving-schools/${schoolId.value}/categories`, {
      method: 'POST',
      body: {
        categoryId: Number(selectedCategoryId.value)
      }
    })

    successMessage.value = 'Category added to the driving school.'
    selectedCategoryId.value = null
  } catch (error: unknown) {
    const reason = (error as any)?.data?.statusMessage
      ?? (error as any)?.data?.message
      ?? (error as Error)?.message
      ?? 'Unable to add the category right now.'
    formError.value = reason
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="dh-category-add-page">
    <section class="dh-category-add-page__hero">
      <div class="dh-category-add-page__container">
        <p>School / Categories</p>
        <h1>Add a<br><span>category</span></h1>
        <p class="dh-category-add-page__intro">
          Choose an existing training category to add to this driving school profile.
        </p>
      </div>
    </section>

    <section class="dh-category-add-page__body">
      <div class="dh-category-add-page__container">
        <div class="dh-category-add-page__panel">
          <header class="dh-category-add-page__heading">
            <span>School catalogue</span>
            <h2>Add category</h2>
          </header>

          <form class="dh-auth-form" @submit.prevent="submitCategory">
            <label>
              Category
              <select v-model.number="selectedCategoryId" :disabled="categoriesStatus === 'pending' || !categories?.length">
                <option :value="null" disabled>Select a category</option>
                <option v-for="category in categories ?? []" :key="category.id" :value="category.id">
                  {{ category.name }} {{ category.code ? `(${category.code})` : '' }}
                </option>
              </select>
            </label>

            <p v-if="formError" class="dh-auth-form__error" role="alert">{{ formError }}</p>
            <p v-else-if="successMessage" class="dh-category-add-page__success" role="status">{{ successMessage }}</p>

            <div class="dh-category-add-page__actions">
              <button type="submit" class="dh-category-add-page__submit" :disabled="isSubmitting || !categories?.length">
                {{ isSubmitting ? 'Saving category…' : 'Add category →' }}
              </button>

              <NuxtLink class="dh-category-add-page__secondary" :to="schoolRoutes.list">
                Back to schools
              </NuxtLink>
            </div>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dh-category-add-page,
.dh-category-add-page * { box-sizing: border-box; }
.dh-category-add-page { min-height: 100vh; background: var(--dh-color-bg-page); }
.dh-category-add-page__container { width: min(100%, 78rem); margin-inline: auto; }

.dh-category-add-page__hero {
  padding: 4.5rem 6rem 3rem;
  background: var(--dh-color-bg-inverse);
  color: var(--dh-color-text-inverse);
}

.dh-category-add-page__hero p,
.dh-category-add-page__hero h1,
.dh-category-add-page__intro { margin: 0; }

.dh-category-add-page__hero p:first-child {
  color: var(--dh-color-bg-status);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-category-add-page__hero h1 {
  margin-top: 1.25rem;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(4rem, 8vw, 7rem);
  font-weight: 900;
  line-height: 0.82;
  letter-spacing: -0.08rem;
  text-transform: uppercase;
}

.dh-category-add-page__hero h1 span { color: var(--dh-color-bg-accent); }

.dh-category-add-page__intro {
  max-width: 42rem;
  margin-top: 1.5rem;
  color: #d8dcdf;
  font-size: 1.05rem;
  line-height: 1.7;
}

.dh-category-add-page__body { padding: 4rem 6rem 6rem; }

.dh-category-add-page__panel {
  max-width: 42rem;
  margin-inline: auto;
  padding: 2rem;
  border: 1px solid var(--dh-color-border-strong);
  background: var(--dh-color-bg-surface);
}

.dh-category-add-page__heading { margin-bottom: 2rem; }
.dh-category-add-page__heading span {
  color: var(--dh-color-bg-accent);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-category-add-page__heading h2 {
  margin: 0.75rem 0 0;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  line-height: 0.95;
  text-transform: uppercase;
}

.dh-category-add-page :deep(.dh-auth-form) {
  gap: 1.25rem;
}

.dh-category-add-page :deep(.dh-auth-form label) {
  width: 100%;
}

.dh-category-add-page :deep(.dh-auth-form select) {
  width: 100%;
  min-height: 3.5rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--dh-color-border-strong);
  border-radius: 0;
  background: #fff;
  color: var(--dh-color-text-primary);
  font: inherit;
}

.dh-category-add-page__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.dh-category-add-page__submit {
  min-height: 3rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--dh-color-border-strong);
  background: var(--dh-color-bg-status);
  color: var(--dh-color-text-primary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05rem;
  text-transform: uppercase;
  cursor: pointer;
}

.dh-category-add-page__secondary {
  color: var(--dh-color-text-primary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05rem;
  text-decoration: none;
  text-transform: uppercase;
}

.dh-category-add-page__success {
  margin: 0;
  padding: 0.875rem 1rem;
  border-left: 0.3rem solid #3f8e58;
  background: #ebf7ee;
  color: #1b5d32;
  font-size: 0.8125rem;
  line-height: 1.5;
}

@media (max-width: 62rem) {
  .dh-category-add-page__hero,
  .dh-category-add-page__body { padding-inline: 2rem; }
}

@media (max-width: 34rem) {
  .dh-category-add-page__hero,
  .dh-category-add-page__body { padding-inline: 1.25rem; }
  .dh-category-add-page__actions { align-items: flex-start; flex-direction: column; }
}
</style>
