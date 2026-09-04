<script setup lang="ts">
import type { AdminOverview, AdminSchool, SchoolMembership } from '~/types/admin'
const props = defineProps<{
  overview: AdminOverview
  school: AdminSchool
  kind: SchoolMembership
  busy: boolean
}>()
const emit = defineEmits<{ edit: [id: number]; assign: [kind: SchoolMembership, userId: number] }>()
const selectedUser = ref<number | null>(null)
const field = computed(() => (props.kind === 'student' ? 'drivingSchoolId' : 'instructorSchoolId'))
const members = computed(() =>
  props.overview.users.filter((user) => user[field.value] === props.school.id)
)
const candidates = computed(() =>
  props.overview.users.filter(
    (user) =>
      user.role === 'USER' &&
      user[field.value] !== props.school.id &&
      user.managedSchool === null &&
      (props.kind === 'student' ? user.instructorSchoolId === null : user.drivingSchoolId === null)
  )
)
const title = computed(() => (props.kind === 'student' ? 'Students' : 'Instructors'))
const { schoolName } = useAdminDirectory(() => props.overview)
watch(candidates, () => {
  if (!candidates.value.some((user) => user.id === selectedUser.value)) selectedUser.value = null
})
</script>
<template>
  <section class="dh-admin-panel">
    <h3>
      {{ title }}
      <span>{{ members.length }}</span>
    </h3>
    <ul>
      <li v-for="user in members" :key="user.id">
        <div>
          <strong>{{ user.name }}</strong>
          <small>{{ user.email }}</small>
        </div>
        <button
          :disabled="busy"
          :aria-label="`Edit ${kind} ${user.name}`"
          @click="emit('edit', user.id)"
        >
          Edit membership
        </button>
      </li>
    </ul>
    <p v-if="!members.length" class="dh-admin-muted">No {{ title.toLowerCase() }} assigned.</p>
    <form
      class="dh-admin-assign"
      @submit.prevent="selectedUser !== null && emit('assign', kind, selectedUser)"
    >
      <label>
        Assign existing user
        <select v-model="selectedUser" required :disabled="busy">
          <option :value="null" disabled>Choose user</option>
          <option v-for="user in candidates" :key="user.id" :value="user.id">
            {{ user.name }}{{ user[field] ? ` (transfer from ${schoolName(user[field])})` : '' }}
          </option>
        </select>
      </label>
      <small>
        Only unassigned users or existing {{ title.toLowerCase() }} are eligible. Change other roles
        in Users first.
      </small>
      <small v-if="kind === 'instructor'">
        Transfers clear previous vehicle and preferred-instructor assignments.
      </small>
      <button class="dh-admin-button" :disabled="selectedUser === null || busy">
        Assign {{ kind }}
      </button>
    </form>
  </section>
</template>
