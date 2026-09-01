<script lang="ts" setup>
import { schoolRoutes } from '#shared/constants/routes'
import type { SchoolDirectoryItemDto } from '~/types/presentation/schools'
import type { UpdateVehicleInstructorInput, UserSummaryDto, VehicleAssignmentDto } from '~/types/driving-school'

const props = defineProps<{ school: SchoolDirectoryItemDto, position: number }>()

const isEditorOpen = ref(false)
const selectedVehicleId = ref<number | null>(null)
const selectedInstructorId = ref<number | null>(null)
const assignmentMessage = ref('')
const assignmentError = ref('')
const isSaving = ref(false)

const isCategoryEditorOpen = ref(false)
const selectedCategoryId = ref<number | null>(null)
const categoryMessage = ref('')
const categoryError = ref('')
const isCategorySaving = ref(false)

const { data: userOptions, status: usersStatus } = await useFetch<UserSummaryDto[]>('/api/users', {
  key: `users-list`
})
const { data: schoolVehicles, status: vehiclesStatus } = await useFetch<VehicleAssignmentDto[]>(`/api/driving-schools/${props.school.id}/vehicles`, {
  key: `driving-school-vehicles-${props.school.id}`
})
const { data: categoryOptions, status: categoriesStatus } = await useFetch<Array<{ id: number, name: string, code: string | null }>>('/api/categories', {
  key: `category-options-${props.school.id}`
})

const availableVehicles = computed(() => schoolVehicles.value ?? [])
const availableUsers = computed(() => userOptions.value ?? [])

watch(
  () => availableVehicles.value,
  (vehicles) => {
    if (!vehicles.length) {
      selectedVehicleId.value = null
      return
    }

    if (selectedVehicleId.value == null || !vehicles.some(vehicle => vehicle.id === selectedVehicleId.value)) {
      const vehicle = vehicles.find(vehicle => vehicle.instructorId == null) ?? vehicles[0]
      selectedVehicleId.value = vehicle?.id ?? null
    }
  },
  { immediate: true }
)

watch(
  () => availableUsers.value,
  (users) => {
    if (!users.length) {
      selectedInstructorId.value = null
      return
    }

    if (selectedInstructorId.value == null || !users.some(user => user.id === selectedInstructorId.value)) {
      const selectedVehicle = availableVehicles.value.find(vehicle => vehicle.id === selectedVehicleId.value)
      selectedInstructorId.value = selectedVehicle?.instructorId ?? null
    }
  },
  { immediate: true }
)

function formatCity(city: string) {
  return city
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatPrice(value: number) {
  return value > 0 ? `${new Intl.NumberFormat('en-US').format(value)} MKD` : 'Contact school'
}

function openEditor() {
  assignmentError.value = ''
  assignmentMessage.value = ''
  isEditorOpen.value = true
}

function openCategoryEditor() {
  categoryError.value = ''
  categoryMessage.value = ''
  isCategoryEditorOpen.value = true
}

async function addCategoryToSchool() {
  if (!Number.isInteger(selectedCategoryId.value) || selectedCategoryId.value! <= 0) {
    categoryError.value = 'Choose a category to add.'
    return
  }

  isCategorySaving.value = true
  categoryError.value = ''
  categoryMessage.value = ''

  try {
    await $fetch(`/api/driving-schools/${props.school.id}/categories`, {
      method: 'POST',
      body: { categoryId: Number(selectedCategoryId.value) }
    })

    categoryMessage.value = 'Category added successfully.'
    selectedCategoryId.value = null
    isCategoryEditorOpen.value = false
    await refreshNuxtData()
  } catch (error: unknown) {
    const reason = (error as any)?.data?.statusMessage
      ?? (error as any)?.data?.message
      ?? (error as Error)?.message
      ?? 'Unable to add the category right now.'
    categoryError.value = reason
  } finally {
    isCategorySaving.value = false
  }
}

async function assignInstructorToVehicle() {
  if (!selectedVehicleId.value || selectedInstructorId.value == null) {
    assignmentError.value = 'Choose both a vehicle and an instructor.'
    return
  }

  isSaving.value = true
  assignmentError.value = ''
  assignmentMessage.value = ''

  try {
    const payload: UpdateVehicleInstructorInput = { instructorId: Number(selectedInstructorId.value) }

    await $fetch(`/api/vehicles/${selectedVehicleId.value}`, {
      method: 'PATCH',
      body: payload
    })

    assignmentMessage.value = 'Instructor assigned successfully.'
    await refreshNuxtData(`driving-school-vehicles-${props.school.id}`)
    await refreshNuxtData('users-list')
    await refreshNuxtData(`driving-school-vehicles-${props.school.id}`)
  } catch (error: unknown) {
    const reason = (error as any)?.data?.statusMessage
      ?? (error as any)?.data?.message
      ?? (error as Error)?.message
      ?? 'Unable to assign the instructor right now.'
    assignmentError.value = reason
  } finally {
    isSaving.value = false
  }
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
        <div class="dh-directory-card__actions">
          <NuxtLink class="dh-directory-card__view-button" :to="schoolRoutes.detail(school.id)">View details</NuxtLink>
          <button type="button" class="dh-directory-card__edit-button" @click.stop="openEditor">Edit</button>
          <button type="button" class="dh-directory-card__add-category-button" @click.stop="openCategoryEditor">Add category</button>
          <NuxtLink class="dh-directory-card__add-car-button" :to="schoolRoutes.createVehicle(school.id)" @click.stop>Add car</NuxtLink>
        </div>
      </div>
    </div>

    <div v-if="isCategoryEditorOpen" class="dh-directory-card__editor" role="dialog" aria-modal="true" aria-label="Add category to school">
      <div class="dh-directory-card__editor-panel">
        <div class="dh-directory-card__editor-header">
          <h3>Add category</h3>
          <button type="button" class="dh-directory-card__close-button" @click="isCategoryEditorOpen = false">×</button>
        </div>

        <div class="dh-directory-card__editor-form">
          <label>
            Category
            <select v-model.number="selectedCategoryId" :disabled="categoriesStatus === 'pending' || !(categoryOptions && categoryOptions.length)">
              <option :value="null">Select a category</option>
              <option v-for="category in categoryOptions ?? []" :key="category.id" :value="category.id">
                {{ category.name }} {{ category.code ? `(${category.code})` : '' }}
              </option>
            </select>
          </label>

          <p v-if="categoryError" class="dh-directory-card__error" role="alert">{{ categoryError }}</p>
          <p v-else-if="categoryMessage" class="dh-directory-card__success" role="status">{{ categoryMessage }}</p>

          <button type="button" class="dh-directory-card__save-button" :disabled="isCategorySaving || !(categoryOptions && categoryOptions.length)" @click="addCategoryToSchool">
            {{ isCategorySaving ? 'Saving…' : 'Add category' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="isEditorOpen" class="dh-directory-card__editor" role="dialog" aria-modal="true" aria-label="Assign instructor to vehicle">
      <div class="dh-directory-card__editor-panel">
        <div class="dh-directory-card__editor-header">
          <h3>Assign instructor</h3>
          <button type="button" class="dh-directory-card__close-button" @click="isEditorOpen = false">×</button>
        </div>

        <div class="dh-directory-card__editor-form">
          <label>
            Vehicle
            <select v-model.number="selectedVehicleId" :disabled="vehiclesStatus === 'pending' || !availableVehicles.length">
              <option v-for="vehicle in availableVehicles" :key="vehicle.id" :value="vehicle.id">
                {{ vehicle.registration }} · {{ vehicle.brand }} {{ vehicle.model }}
              </option>
            </select>
          </label>

          <label>
            Instructor
            <select v-model.number="selectedInstructorId" :disabled="usersStatus === 'pending' || !availableUsers.length">
              <option :value="null">Select instructor</option>
              <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                {{ user.name }} ({{ user.email }})
              </option>
            </select>
          </label>

          <p v-if="assignmentError" class="dh-directory-card__error" role="alert">{{ assignmentError }}</p>
          <p v-else-if="assignmentMessage" class="dh-directory-card__success" role="status">{{ assignmentMessage }}</p>

          <button type="button" class="dh-directory-card__save-button" :disabled="isSaving || !availableVehicles.length || !availableUsers.length" @click="assignInstructorToVehicle">
            {{ isSaving ? 'Saving…' : 'Apply assignment' }}
          </button>
        </div>
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
.dh-directory-card__actions { display: flex; align-items: center; gap: 0.75rem; }
.dh-directory-card__edit-button,
.dh-directory-card__view-button,
.dh-directory-card__add-car-button,
.dh-directory-card__add-category-button,
.dh-directory-card__save-button,
.dh-directory-card__close-button { border: 1px solid var(--dh-color-border-strong); background: var(--dh-color-bg-status); color: var(--dh-color-text-primary); font: inherit; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05rem; text-transform: uppercase; cursor: pointer; }
.dh-directory-card__edit-button,
.dh-directory-card__view-button,
.dh-directory-card__add-car-button,
.dh-directory-card__add-category-button,
.dh-directory-card__save-button { display: inline-flex; align-items: center; justify-content: center; min-height: 2.75rem; padding: 0.6rem 0.8rem; line-height: 1; }
.dh-directory-card__view-button,
.dh-directory-card__add-car-button,
.dh-directory-card__add-category-button { text-decoration: none; }
.dh-directory-card__close-button { width: 2rem; height: 2rem; font-size: 1.25rem; }
.dh-directory-card__footer a { color: var(--dh-color-text-primary); font-size: 0.75rem; font-weight: 600; text-decoration: none; text-transform: uppercase; white-space: nowrap; }
.dh-directory-card__footer a:hover { color: var(--dh-color-bg-accent); }
.dh-directory-card__footer a:focus-visible { outline: 2px solid var(--dh-color-bg-status); outline-offset: 3px; }

.dh-directory-card__editor {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(8, 10, 12, 0.7);
  padding: 1rem;
}

.dh-directory-card__editor-panel {
  width: min(100%, 28rem);
  border: 1px solid var(--dh-color-border-strong);
  background: var(--dh-color-bg-surface);
  padding: 1.25rem;
  color: var(--dh-color-text-primary);
}

.dh-directory-card__editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dh-directory-card__editor-header h3 {
  margin: 0;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 2rem;
  line-height: 1;
  text-transform: uppercase;
}

.dh-directory-card__editor-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dh-directory-card__editor-form label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04rem;
  text-transform: uppercase;
}

.dh-directory-card__editor-form select {
  min-height: 2.8rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--dh-color-border-strong);
  background: #fff;
  color: var(--dh-color-text-primary);
  font: inherit;
}

.dh-directory-card__success,
.dh-directory-card__error {
  margin: 0;
  padding: 0.75rem 0.9rem;
  font-size: 0.75rem;
  line-height: 1.5;
}

.dh-directory-card__success {
  border-left: 0.25rem solid #3f8e58;
  background: #ebf7ee;
  color: #1b5d32;
}

.dh-directory-card__error {
  border-left: 0.25rem solid #a9422c;
  background: #fceae7;
  color: #7c2d1c;
}

.dh-directory-card { position: relative; }

@media (max-width: 32rem) {
  .dh-directory-card__title-row,
  .dh-directory-card__footer,
  .dh-directory-card__actions { align-items: flex-start; flex-direction: column; }
  .dh-directory-card__rating { text-align: left; }
}
</style>
