<script lang="ts" setup>
import { schoolRoutes } from '#shared/constants/routes'
import type { CreateDrivingSchoolInput, UserSummaryDto } from '~/types/driving-school'

const initialForm: CreateDrivingSchoolInput = {
  name: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  description: '',
  managerId: undefined
}

const form = reactive<CreateDrivingSchoolInput>({ ...initialForm })
const formError = ref('')
const successMessage = ref('')

const { data: users, status: usersStatus, error: usersError } = await useFetch<UserSummaryDto[]>('/api/users')
const managerOptions = computed(() => (users.value ?? []).map(user => ({
  value: user.id,
  label: `${user.name} (${user.email})`
})))

const { createDrivingSchool, mutationStatus } = useDrivingSchools()
const isSubmitting = computed(() => mutationStatus.value === 'pending')

function resetForm() {
  Object.assign(form, initialForm)
}

async function submitSchool() {
  formError.value = ''
  successMessage.value = ''

  if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.managerId) {
    formError.value = 'Please complete the school fields and choose a school manager.'
    return
  }

  try {
    await createDrivingSchool({
      name: form.name,
      email: form.email,
      phone: form.phone,
      city: form.city?.trim() || undefined,
      address: form.address,
      description: form.description?.trim() || undefined,
      managerId: Number(form.managerId)
    })

    successMessage.value = 'Driving school created successfully and added to the directory.'
    resetForm()
  } catch (error: unknown) {
    const reason = (error as any)?.data?.statusMessage
      ?? (error as any)?.data?.message
      ?? (error as Error)?.message
      ?? 'Unable to create the driving school right now. Please try again.'
    formError.value = reason
  }
}
</script>

<template>
  <div class="dh-driving-school-form">
    <section class="dh-driving-school-form__panel">
      <header class="dh-driving-school-form__heading">
        <span>School / New profile</span>
        <h2>Register a driving school</h2>
      </header>

      <form class="dh-auth-form" @submit.prevent="submitSchool">
        <div class="dh-driving-school-form__grid">
          <label>
            School name
            <input v-model.trim="form.name" type="text" maxlength="120" required autofocus>
          </label>

          <label>
            Email
            <input v-model.trim="form.email" type="email" maxlength="120" required>
          </label>

          <label>
            Phone
            <input v-model.trim="form.phone" type="tel" maxlength="40" required>
          </label>

          <label>
            City
            <input v-model.trim="form.city" type="text" maxlength="80" placeholder="Skopje">
          </label>
        </div>

        <label>
          Address
          <input v-model.trim="form.address" type="text" maxlength="200" required>
        </label>

        <label>
          School manager
          <select v-model.number="form.managerId" :disabled="usersStatus === 'pending' || managerOptions.length === 0" required>
            <option :value="undefined" disabled>Select a manager</option>
            <option v-for="user in managerOptions" :key="user.value" :value="user.value">
              {{ user.label }}
            </option>
          </select>
        </label>

        <p v-if="usersError" class="dh-auth-form__error" role="alert">Unable to load users for manager selection.</p>
        <p v-else-if="!managerOptions.length && usersStatus !== 'pending'" class="dh-auth-form__error" role="alert">No users are available to assign as school managers.</p>

        <label>
          Description
          <textarea v-model.trim="form.description" rows="4" maxlength="500" placeholder="Tell applicants about the school, instructors, and packages."></textarea>
        </label>

        <p v-if="formError" class="dh-auth-form__error" role="alert">{{ formError }}</p>
        <p v-else-if="successMessage" class="dh-driving-school-form__success" role="status">{{ successMessage }}</p>

        <div class="dh-driving-school-form__actions">
          <AppButton
            type="submit"
            :disabled="isSubmitting"
            :text="isSubmitting ? 'Saving school…' : 'Create school →'"
          />

          <NuxtLink class="dh-driving-school-form__secondary" :to="schoolRoutes.list">
            Back to schools
          </NuxtLink>
        </div>
      </form>
    </section>

    <aside class="dh-driving-school-form__summary" aria-label="School profile checklist">
      <p>School / Profile checklist</p>
      <h3>Before launch</h3>
      <ul>
        <li>Verified school name and contact details</li>
        <li>City and address entered for directory filtering</li>
        <li>Short description ready for the public profile</li>
      </ul>
      <div>
        <span>Live directory</span>
        <strong>01</strong>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.dh-driving-school-form,
.dh-driving-school-form * { box-sizing: border-box; }
.dh-driving-school-form {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(16rem, 0.75fr);
  gap: 2rem;
  width: 100%;
}

.dh-driving-school-form__panel,
.dh-driving-school-form__summary {
  border: 1px solid var(--dh-color-border-strong);
  background: var(--dh-color-bg-surface);
}

.dh-driving-school-form__panel {
  padding: 2rem;
}

.dh-driving-school-form__heading {
  margin-bottom: 2rem;
}

.dh-driving-school-form__heading span {
  color: var(--dh-color-bg-accent);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-driving-school-form__heading h2 {
  margin: 0.75rem 0 0;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  line-height: 0.95;
  text-transform: uppercase;
}

.dh-driving-school-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}

.dh-driving-school-form :deep(.dh-auth-form) {
  gap: 1.25rem;
}

.dh-driving-school-form :deep(.dh-auth-form label) {
  width: 100%;
}

.dh-driving-school-form :deep(.dh-auth-form input),
.dh-driving-school-form :deep(.dh-auth-form select),
.dh-driving-school-form :deep(.dh-auth-form textarea) {
  width: 100%;
  min-height: 3.5rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--dh-color-border-strong);
  border-radius: 0;
  background: #fff;
  color: var(--dh-color-text-primary);
  font: inherit;
}

.dh-driving-school-form :deep(.dh-auth-form textarea) {
  min-height: 8rem;
  resize: vertical;
}

.dh-driving-school-form :deep(.dh-auth-form select) {
  appearance: auto;
  cursor: pointer;
}

.dh-driving-school-form__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.dh-driving-school-form__secondary {
  color: var(--dh-color-text-primary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05rem;
  text-decoration: none;
  text-transform: uppercase;
}

.dh-driving-school-form__success {
  margin: 0;
  padding: 0.875rem 1rem;
  border-left: 0.3rem solid #3f8e58;
  background: #ebf7ee;
  color: #1b5d32;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.dh-driving-school-form__summary {
  display: flex;
  padding: 2rem 1.5rem;
  flex-direction: column;
  justify-content: space-between;
  background: var(--dh-color-bg-inverse);
  color: var(--dh-color-text-inverse);
}

.dh-driving-school-form__summary p,
.dh-driving-school-form__summary h3,
.dh-driving-school-form__summary ul,
.dh-driving-school-form__summary div {
  margin: 0;
}

.dh-driving-school-form__summary p {
  color: var(--dh-color-bg-status);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-driving-school-form__summary h3 {
  margin-top: 1rem;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(2.2rem, 4vw, 3.25rem);
  line-height: 1;
  text-transform: uppercase;
}

.dh-driving-school-form__summary ul {
  display: grid;
  gap: 0.9rem;
  margin-top: 1.5rem;
  padding-left: 1.1rem;
  color: #d6dbe0;
  line-height: 1.6;
}

.dh-driving-school-form__summary div {
  display: flex;
  margin-top: 2rem;
  padding-top: 1rem;
  align-items: end;
  justify-content: space-between;
  border-top: 1px solid #424950;
}

.dh-driving-school-form__summary span {
  color: #9fa7ad;
  font-size: 0.6875rem;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
}

.dh-driving-school-form__summary strong {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 4rem;
  line-height: 0.8;
}

@media (max-width: 62rem) {
  .dh-driving-school-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 34rem) {
  .dh-driving-school-form__grid {
    grid-template-columns: 1fr;
  }

  .dh-driving-school-form__panel,
  .dh-driving-school-form__summary {
    padding: 1.25rem;
  }

  .dh-driving-school-form__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
