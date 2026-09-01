<script lang="ts" setup>
import { schoolRoutes } from '#shared/constants/routes'

definePageMeta({ layout: 'default' })

const route = useRoute()
const schoolId = computed(() => Number(route.params.id))
const vehicleForm = reactive({
  registration: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  instructorId: null as number | null
})
const formError = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

const { data: userOptions, status: userStatus } = await useFetch('/api/users')
const instructorOptions = computed(() => (userOptions.value ?? []) as Array<{ id: number, name: string, email: string }>)

async function submitVehicle() {
  formError.value = ''
  successMessage.value = ''

  if (!vehicleForm.registration.trim() || !vehicleForm.brand.trim() || !vehicleForm.model.trim() || !Number.isInteger(vehicleForm.year)) {
    formError.value = 'Please complete all vehicle fields before saving.'
    return
  }

  isSubmitting.value = true

  try {
    await $fetch(`/api/driving-schools/${schoolId.value}/vehicles`, {
      method: 'POST',
      body: {
        registration: vehicleForm.registration.trim(),
        brand: vehicleForm.brand.trim(),
        model: vehicleForm.model.trim(),
        year: Number(vehicleForm.year),
        instructorId: vehicleForm.instructorId == null ? null : Number(vehicleForm.instructorId)
      }
    })

    successMessage.value = 'Vehicle created successfully.'
    vehicleForm.registration = ''
    vehicleForm.brand = ''
    vehicleForm.model = ''
    vehicleForm.year = new Date().getFullYear()
    vehicleForm.instructorId = null
  } catch (error: unknown) {
    const reason = (error as any)?.data?.statusMessage
      ?? (error as any)?.data?.message
      ?? (error as Error)?.message
      ?? 'Unable to create the vehicle right now.'
    formError.value = reason
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="dh-vehicle-create-page">
    <section class="dh-vehicle-create-page__hero">
      <div class="dh-vehicle-create-page__container">
        <p>Fleet / New vehicle</p>
        <h1>Add a<br><span>car</span></h1>
        <p class="dh-vehicle-create-page__intro">
          Register a vehicle for this driving school and optionally assign the first instructor.
        </p>
      </div>
    </section>

    <section class="dh-vehicle-create-page__body">
      <div class="dh-vehicle-create-page__container">
        <div class="dh-vehicle-create-page__panel">
          <header class="dh-vehicle-create-page__heading">
            <span>School fleet</span>
            <h2>Create vehicle</h2>
          </header>

          <form class="dh-auth-form" @submit.prevent="submitVehicle">
            <div class="dh-vehicle-create-page__grid">
              <label>
                Registration
                <input v-model.trim="vehicleForm.registration" type="text" maxlength="20" required>
              </label>

              <label>
                Year
                <input v-model.number="vehicleForm.year" type="number" min="1900" max="2100" step="1" required>
              </label>

              <label>
                Brand
                <input v-model.trim="vehicleForm.brand" type="text" maxlength="80" required>
              </label>

              <label>
                Model
                <input v-model.trim="vehicleForm.model" type="text" maxlength="80" required>
              </label>
            </div>

            <label>
              Instructor (optional)
              <select v-model.number="vehicleForm.instructorId" :disabled="userStatus === 'pending' || !instructorOptions.length">
                <option :value="null">No instructor assigned yet</option>
                <option v-for="user in instructorOptions" :key="user.id" :value="user.id">
                  {{ user.name }} ({{ user.email }})
                </option>
              </select>
            </label>

            <p v-if="formError" class="dh-auth-form__error" role="alert">{{ formError }}</p>
            <p v-else-if="successMessage" class="dh-vehicle-create-page__success" role="status">{{ successMessage }}</p>

            <div class="dh-vehicle-create-page__actions">
              <button type="submit" class="dh-vehicle-create-page__submit" :disabled="isSubmitting">
                {{ isSubmitting ? 'Saving vehicle…' : 'Create vehicle →' }}
              </button>

              <NuxtLink class="dh-vehicle-create-page__secondary" :to="schoolRoutes.list">
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
.dh-vehicle-create-page,
.dh-vehicle-create-page * { box-sizing: border-box; }
.dh-vehicle-create-page { min-height: 100vh; background: var(--dh-color-bg-page); }
.dh-vehicle-create-page__container { width: min(100%, 78rem); margin-inline: auto; }

.dh-vehicle-create-page__hero {
  padding: 4.5rem 6rem 3rem;
  background: var(--dh-color-bg-inverse);
  color: var(--dh-color-text-inverse);
}

.dh-vehicle-create-page__hero p,
.dh-vehicle-create-page__hero h1,
.dh-vehicle-create-page__intro { margin: 0; }

.dh-vehicle-create-page__hero p:first-child {
  color: var(--dh-color-bg-status);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-vehicle-create-page__hero h1 {
  margin-top: 1.25rem;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(4rem, 8vw, 7rem);
  font-weight: 900;
  line-height: 0.82;
  letter-spacing: -0.08rem;
  text-transform: uppercase;
}

.dh-vehicle-create-page__hero h1 span { color: var(--dh-color-bg-accent); }

.dh-vehicle-create-page__intro {
  max-width: 42rem;
  margin-top: 1.5rem;
  color: #d8dcdf;
  font-size: 1.05rem;
  line-height: 1.7;
}

.dh-vehicle-create-page__body { padding: 4rem 6rem 6rem; }

.dh-vehicle-create-page__panel {
  max-width: 52rem;
  margin-inline: auto;
  padding: 2rem;
  border: 1px solid var(--dh-color-border-strong);
  background: var(--dh-color-bg-surface);
}

.dh-vehicle-create-page__heading { margin-bottom: 2rem; }
.dh-vehicle-create-page__heading span {
  color: var(--dh-color-bg-accent);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-vehicle-create-page__heading h2 {
  margin: 0.75rem 0 0;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  line-height: 0.95;
  text-transform: uppercase;
}

.dh-vehicle-create-page :deep(.dh-auth-form) {
  gap: 1.25rem;
}

.dh-vehicle-create-page :deep(.dh-auth-form label) {
  width: 100%;
}

.dh-vehicle-create-page :deep(.dh-auth-form input),
.dh-vehicle-create-page :deep(.dh-auth-form select) {
  width: 100%;
  min-height: 3.5rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--dh-color-border-strong);
  border-radius: 0;
  background: #fff;
  color: var(--dh-color-text-primary);
  font: inherit;
}

.dh-vehicle-create-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}

.dh-vehicle-create-page__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.dh-vehicle-create-page__submit {
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

.dh-vehicle-create-page__secondary {
  color: var(--dh-color-text-primary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05rem;
  text-decoration: none;
  text-transform: uppercase;
}

.dh-vehicle-create-page__success {
  margin: 0;
  padding: 0.875rem 1rem;
  border-left: 0.3rem solid #3f8e58;
  background: #ebf7ee;
  color: #1b5d32;
  font-size: 0.8125rem;
  line-height: 1.5;
}

@media (max-width: 62rem) {
  .dh-vehicle-create-page__hero,
  .dh-vehicle-create-page__body { padding-inline: 2rem; }
}

@media (max-width: 34rem) {
  .dh-vehicle-create-page__hero,
  .dh-vehicle-create-page__body { padding-inline: 1.25rem; }
  .dh-vehicle-create-page__grid { grid-template-columns: 1fr; }
  .dh-vehicle-create-page__actions { align-items: flex-start; flex-direction: column; }
}
</style>
