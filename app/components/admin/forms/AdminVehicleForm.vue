<script setup lang="ts">
import type { AdminOverview, AdminVehicleFormValue } from '~/types/admin'
const props = defineProps<{ overview: AdminOverview; id: number | null }>()
const form = defineModel<AdminVehicleFormValue>({ required: true })
const ordinaryUsers = computed(() => props.overview.users.filter((user) => user.role === 'USER'))
const instructors = computed(() =>
  ordinaryUsers.value.filter(
    (user) =>
      form.value.drivingSchoolId !== null && user.instructorSchoolId === form.value.drivingSchoolId
  )
)
watch(
  () => form.value.drivingSchoolId,
  () => {
    form.value.instructorId = null
  }
)
</script>
<template>
  <label>
    Registration
    <input v-model="form.registration" required maxlength="40" />
  </label>
  <div class="dh-admin-form-grid">
    <label>
      Brand
      <input v-model="form.brand" required maxlength="80" />
    </label>
    <label>
      Model
      <input v-model="form.model" required maxlength="80" />
    </label>
  </div>
  <label>
    Year
    <input
      v-model.number="form.year"
      type="number"
      required
      min="1900"
      :max="new Date().getFullYear() + 1"
    />
  </label>
  <label>
    School
    <select v-model="form.drivingSchoolId" required>
      <option :value="null" disabled>Choose school</option>
      <option v-for="school in overview.schools" :key="school.id" :value="school.id">
        {{ school.name }}
      </option>
    </select>
  </label>
  <label>
    Assigned instructor
    <select v-model="form.instructorId">
      <option :value="null">Unassigned</option>
      <option v-for="user in instructors" :key="user.id" :value="user.id">{{ user.name }}</option>
    </select>
  </label>
</template>
