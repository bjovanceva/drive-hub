<script setup lang="ts">
import type { AdminOverview, AdminApplicationFormValue } from '~/types/admin'
const props = defineProps<{ overview: AdminOverview; id: number | null }>()
const form = defineModel<AdminApplicationFormValue>({ required: true })
const ordinaryUsers = computed(() => props.overview.users.filter((user) => user.role === 'USER'))
const canApprove = computed(() => {
  const user = ordinaryUsers.value.find((user) => user.id === form.value.userId)
  return !!user && user.instructorSchoolId === null && user.managedSchool === null
})
const instructors = computed(() =>
  ordinaryUsers.value.filter(
    (user) =>
      form.value.drivingSchoolId !== null && user.instructorSchoolId === form.value.drivingSchoolId
  )
)
const categories = computed(() => {
  const ids =
    props.overview.schools
      .find((school) => school.id === form.value.drivingSchoolId)
      ?.categories.map((category) => category.id) ?? []
  return props.overview.categories.filter((category) => ids.includes(category.id))
})
watch(
  () => form.value.drivingSchoolId,
  () => {
    form.value.categoryId = null
    form.value.preferredInstructorId = null
  }
)
</script>
<template>
  <label>
    Applicant
    <select v-model="form.userId" required>
      <option :value="null" disabled>Choose user</option>
      <option v-for="user in ordinaryUsers" :key="user.id" :value="user.id">
        {{ user.name }} · {{ user.email }}
      </option>
    </select>
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
    Category
    <select v-model="form.categoryId" required :disabled="!form.drivingSchoolId">
      <option :value="null" disabled>Choose category</option>
      <option v-for="category in categories" :key="category.id" :value="category.id">
        {{ category.code }} · {{ category.name }}
      </option>
    </select>
    <small v-if="form.drivingSchoolId && !categories.length">
      Add offered categories in the school editor first.
    </small>
  </label>
  <label>
    Preferred instructor
    <select v-model="form.preferredInstructorId">
      <option :value="null">No preference</option>
      <option v-for="user in instructors" :key="user.id" :value="user.id">{{ user.name }}</option>
    </select>
  </label>
  <label>
    Status
    <select v-model="form.status">
      <option>PENDING</option>
      <option :disabled="!canApprove">APPROVED</option>
      <option>REJECTED</option>
      <option>CANCELLED</option>
    </select>
  </label>
  <p class="dh-admin-note">
    <span v-if="!canApprove">
      Instructors and managers cannot be enrolled as students. Change their role in Users first.
    </span>
    Approval enrolls the applicant at this school. Other status changes and deletion leave existing
    enrollment in place; manage it in Users.
  </p>
</template>
