<script lang="ts" setup>
import { authRoutes, schoolRoutes } from '#shared/constants/routes'

definePageMeta({ layout: 'default', middleware: 'auth' })

useSeoMeta({
  title: 'Start application | Drive Hub',
  description: 'Apply to a driving school through Drive Hub.'
})

interface SchoolOption {
  id: number
  name: string
  city: string | null
  categories: Array<{
    id: number
    name: string
    code: string | null
  }>
}

interface CreatedApplication {
  id: number
  status: string
  drivingSchoolId: number
  categoryId: number
  preferredInstructorId: number | null
}

interface InstructorOption {
  id: number
  name: string
  email: string
}

const route = useRoute()
const { user, logout, mutationStatus } = useAuth()
const { data: schools, status: schoolsStatus, error: schoolsError } = await useFetch<SchoolOption[]>('/api/driving-schools')

const initialSchoolId = Number(route.query.schoolId)
const initialCategoryId = Number(route.query.categoryId)
const selectedSchoolId = ref<number | null>(Number.isInteger(initialSchoolId) && initialSchoolId > 0 ? initialSchoolId : null)
const selectedCategoryId = ref<number | null>(Number.isInteger(initialCategoryId) && initialCategoryId > 0 ? initialCategoryId : null)
const selectedInstructorId = ref<number | null>(null)
const instructorOptions = ref<InstructorOption[]>([])
const instructorsStatus = ref<'idle' | 'pending'>('idle')
const formError = ref('')
const isSubmitting = ref(false)
const createdApplication = ref<CreatedApplication | null>(null)

const selectedSchool = computed(() => schools.value?.find(school => school.id === selectedSchoolId.value))
const categoryOptions = computed(() => selectedSchool.value?.categories ?? [])

watch(selectedSchoolId, (schoolId, previousSchoolId) => {
  if (schoolId !== previousSchoolId && !categoryOptions.value.some(category => category.id === selectedCategoryId.value)) {
    selectedCategoryId.value = null
  }

  selectedInstructorId.value = null
  instructorOptions.value = []

  if (!schoolId) {
    instructorsStatus.value = 'idle'
    return
  }

  instructorsStatus.value = 'pending'
  $fetch<InstructorOption[]>(`/api/driving-schools/${schoolId}/instructors`)
    .then(instructors => { instructorOptions.value = instructors })
    .catch(() => { instructorOptions.value = [] })
    .finally(() => { instructorsStatus.value = 'idle' })
}, { immediate: true })

async function submitApplication() {
  formError.value = ''

  if (!selectedSchoolId.value || !selectedCategoryId.value) {
    formError.value = 'Choose a driving school and category before continuing.'
    return
  }

  isSubmitting.value = true

  try {
    createdApplication.value = await $fetch<CreatedApplication>('/api/applications', {
      method: 'POST',
      body: {
        drivingSchoolId: selectedSchoolId.value,
        categoryId: selectedCategoryId.value,
        preferredInstructorId: selectedInstructorId.value
      }
    })
  } catch (error: unknown) {
    formError.value = (error as any)?.data?.statusMessage
      ?? (error as any)?.data?.message
      ?? (error as Error)?.message
      ?? 'Unable to submit your application right now.'
  } finally {
    isSubmitting.value = false
  }
}

/** Ends the sealed session before returning to the public login page. */
async function signOut() {
  await logout()
  await navigateTo(authRoutes.login)
}
</script>

<template>
  <div class="dh-application-page">
    <section class="dh-application-page__hero">
      <div class="dh-application-page__container">
        <p>Application / New request</p>
        <h1>Choose your<br><span>school.</span></h1>
        <div class="dh-application-page__identity">
          <div>
            <small>Applying as</small>
            <strong>{{ user?.name }}</strong>
            <span>{{ user?.email }}</span>
          </div>
          <button type="button" :disabled="mutationStatus === 'pending'" @click="signOut">Sign out</button>
        </div>
      </div>
    </section>

    <section class="dh-application-page__body">
      <div class="dh-application-page__container dh-application-page__content">
        <div v-if="createdApplication" class="dh-application-page__success" role="status">
          <span>Application submitted</span>
          <h2>Your request is pending.</h2>
          <p>{{ selectedSchool?.name }} will review your application for {{ categoryOptions.find(category => category.id === createdApplication?.categoryId)?.name }}.</p>
          <NuxtLink :to="schoolRoutes.detail(createdApplication.drivingSchoolId)">View driving school →</NuxtLink>
        </div>

        <form v-else class="dh-application-form" @submit.prevent="submitApplication">
          <header>
            <span>01 / Application details</span>
            <h2>Start your application</h2>
            <p>Select a school and the licence category you want to pursue.</p>
          </header>

          <label>
            Driving school
            <div class="dh-application-form__readonly-field">
              {{ selectedSchool?.name || (schoolsStatus === 'pending' ? 'Loading driving school…' : 'Driving school not selected') }}
            </div>
          </label>

          <label>
            Licence category
            <select v-model="selectedCategoryId" :disabled="!selectedSchoolId || !categoryOptions.length" required>
              <option :value="null">Choose a category</option>
              <option v-for="category in categoryOptions" :key="category.id" :value="category.id">
                {{ category.name }}{{ category.code ? ` (${category.code})` : '' }}
              </option>
            </select>
          </label>

          <label>
            Preferred instructor (optional)
            <select v-model="selectedInstructorId" :disabled="!selectedSchoolId || instructorsStatus === 'pending' || !instructorOptions.length">
              <option :value="null">No preferred instructor</option>
              <option v-for="instructor in instructorOptions" :key="instructor.id" :value="instructor.id">
                {{ instructor.name }} · {{ instructor.email }}
              </option>
            </select>
          </label>

          <p v-if="schoolsError" class="dh-application-form__error" role="alert">Unable to load driving schools. Please try again.</p>
          <p v-else-if="!schools?.length && schoolsStatus !== 'pending'" class="dh-application-form__error" role="alert">No driving schools are available yet.</p>
          <p v-if="formError" class="dh-application-form__error" role="alert">{{ formError }}</p>

          <button type="submit" :disabled="isSubmitting || schoolsStatus === 'pending'">
            {{ isSubmitting ? 'Submitting application…' : 'Submit application →' }}
          </button>
          <NuxtLink to="/schools">Browse driving schools</NuxtLink>
        </form>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dh-application-page,
.dh-application-page * { box-sizing: border-box; }
.dh-application-page { min-height: 100vh; background: var(--dh-color-bg-page); }
.dh-application-page__container { width: 100%; max-width: 78rem; margin-inline: auto; }
.dh-application-page__hero { padding: 4.5rem 6rem 4rem; background: var(--dh-color-bg-inverse); color: var(--dh-color-text-inverse); }
.dh-application-page__hero p { margin: 0 0 1rem; color: var(--dh-color-bg-status); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.075rem; text-transform: uppercase; }
.dh-application-page__hero h1 { margin: 0; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(4.5rem, 8vw, 7rem); font-weight: 900; line-height: 0.82; text-transform: uppercase; }
.dh-application-page__hero h1 span { color: var(--dh-color-bg-accent); }
.dh-application-page__identity { display: flex; margin-top: 3rem; padding-top: 1.5rem; align-items: end; justify-content: space-between; gap: 2rem; border-top: 1px solid #424950; }
.dh-application-page__identity div { display: flex; flex-direction: column; gap: 0.25rem; }
.dh-application-page__identity small { color: #9fa7ad; font-size: 0.625rem; text-transform: uppercase; }
.dh-application-page__identity strong { font-size: 1.125rem; }
.dh-application-page__identity span { color: #c8ced4; font-size: 0.8125rem; }
.dh-application-page__identity button { min-height: 2.75rem; padding: 0 1rem; border: 1px solid #fff; background: transparent; color: #fff; font-weight: 700; text-transform: uppercase; cursor: pointer; }
.dh-application-page__body { padding: 5rem 6rem; }
.dh-application-page__content { max-width: 48rem; }
.dh-application-form,
.dh-application-page__success { display: flex; padding: 2rem; flex-direction: column; gap: 1.25rem; border: 1px solid var(--dh-color-border-strong); background: var(--dh-color-bg-surface); }
.dh-application-form header { margin-bottom: 1rem; }
.dh-application-form header span,
.dh-application-page__success > span { color: var(--dh-color-bg-accent); font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.075rem; text-transform: uppercase; }
.dh-application-form h2,
.dh-application-page__success h2 { margin: 0.75rem 0 0; font-family: 'Barlow Condensed', sans-serif; font-size: 3rem; line-height: 1; text-transform: uppercase; }
.dh-application-form header p,
.dh-application-page__success p { margin: 0.75rem 0 0; color: var(--dh-color-text-secondary); line-height: 1.6; }
.dh-application-form label { display: flex; flex-direction: column; gap: 0.5rem; color: var(--dh-color-text-secondary); font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.05rem; text-transform: uppercase; }
.dh-application-form select,
.dh-application-form__readonly-field { width: 100%; height: 3.5rem; padding: 0 1rem; border: 1px solid var(--dh-color-border-strong); border-radius: 0; background: #fff; color: var(--dh-color-text-primary); font: inherit; }
.dh-application-form__readonly-field { display: flex; align-items: center; font-weight: 600; }
.dh-application-form button { min-height: 3.75rem; border: 1px solid var(--dh-color-border-strong); border-radius: 0; background: var(--dh-color-bg-accent); color: #fff; font-weight: 800; letter-spacing: 0.04rem; text-transform: uppercase; cursor: pointer; }
.dh-application-form button:hover { background: var(--dh-color-bg-accent-hover); }
.dh-application-form button:disabled { cursor: wait; opacity: 0.65; }
.dh-application-form a,
.dh-application-page__success a { color: var(--dh-color-text-primary); font-size: 0.75rem; font-weight: 800; text-decoration: none; text-transform: uppercase; }
.dh-application-form__error { margin: 0; padding: 0.875rem 1rem; border-left: 0.3rem solid var(--dh-color-bg-accent); background: #fff0ed; color: #8f2619; font-size: 0.8125rem; line-height: 1.5; }

@media (max-width: 62rem) {
  .dh-application-page__hero,
  .dh-application-page__body { padding-inline: 2rem; }
}

@media (max-width: 34rem) {
  .dh-application-page__identity { align-items: flex-start; flex-direction: column; }
  .dh-application-page__hero,
  .dh-application-page__body { padding-inline: 1.25rem; }
}
</style>
