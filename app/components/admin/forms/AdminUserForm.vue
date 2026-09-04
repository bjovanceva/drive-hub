<script setup lang="ts">
import type { AdminOverview, AdminUserFormValue } from '~/types/admin'
defineProps<{ overview: AdminOverview; id: number | null }>()
const form = defineModel<AdminUserFormValue>({ required: true })
type Membership = 'none' | 'studentSchoolId' | 'instructorSchoolId' | 'managedSchoolId' | 'conflict'
const assignedFields = (
  ['studentSchoolId', 'instructorSchoolId', 'managedSchoolId'] as const
).filter((key) => form.value[key] !== null)
const membership = ref<Membership>(
  assignedFields.length > 1 ? 'conflict' : (assignedFields[0] ?? 'none')
)
const selectedSchool = computed({
  get: () =>
    membership.value === 'none' || membership.value === 'conflict'
      ? null
      : form.value[membership.value],
  set: (id: number | null) => {
    if (membership.value !== 'none' && membership.value !== 'conflict')
      form.value[membership.value] = id
  }
})
watch(membership, (kind) => {
  for (const key of ['studentSchoolId', 'instructorSchoolId', 'managedSchoolId'] as const) {
    if (key !== kind) form.value[key] = null
  }
})
</script>
<template>
  <label>
    Full name
    <input v-model="form.name" required minlength="2" maxlength="80" autocomplete="off" />
  </label>
  <label>
    Email
    <input v-model.trim="form.email" type="email" required autocomplete="off" />
  </label>
  <label>
    {{ id === null ? 'Password' : 'New password (leave blank to keep current)' }}
    <input
      v-model="form.password"
      type="password"
      :required="id === null"
      minlength="8"
      maxlength="128"
      pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,128}"
      autocomplete="new-password"
    />
    <small>8–128 characters, including a letter and a number.</small>
  </label>
  <h3>School role</h3>
  <label>
    Role
    <select v-model="membership" required>
      <option v-if="membership === 'conflict'" value="conflict" disabled>
        Choose one role to resolve existing assignments
      </option>
      <option value="none">No school role</option>
      <option value="studentSchoolId">Student</option>
      <option value="instructorSchoolId">Instructor</option>
      <option value="managedSchoolId">Manager</option>
    </select>
  </label>
  <label v-if="membership !== 'none' && membership !== 'conflict'">
    School
    <select v-model="selectedSchool" required>
      <option :value="null" disabled>Choose school</option>
      <option
        v-for="school in overview.schools"
        :key="school.id"
        :value="school.id"
        :disabled="
          membership === 'managedSchoolId' && school.managerId !== null && school.managerId !== id
        "
      >
        {{ school.name
        }}{{
          membership === 'managedSchoolId' && school.managerId !== null && school.managerId !== id
            ? ' (manager assigned)'
            : ''
        }}
      </option>
    </select>
  </label>
  <p class="dh-admin-note">
    A user can have only one school role. Saving a different role replaces their previous
    assignment. Moving or removing an instructor clears vehicle and preferred-instructor links.
    Application history is preserved.
  </p>
</template>
