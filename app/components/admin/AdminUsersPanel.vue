<script setup lang="ts">
import type { AdminOverview, AdminResource, AdminUser } from '~/types/admin'
import { matchesAdminSearch, userRelationshipLabel } from '~/utils/admin/presentation'
const props = defineProps<{ overview: AdminOverview }>()
const emit = defineEmits<{
  edit: [resource: AdminResource, id?: number | null]
  delete: [resource: AdminResource, id: number, name: string]
}>()
const { schoolName } = useAdminDirectory(() => props.overview)
const users = computed(() => props.overview.users)
const applications = computed(() => props.overview.applications)
const search = ref('')
const matches = (...values: (string | null)[]) => matchesAdminSearch(search.value, ...values)

const userFilter = ref('all')
const visibleUsers = computed(() =>
  users.value.filter(
    (user) =>
      matches(user.name, user.email) &&
      (userFilter.value === 'all' ||
        (userFilter.value === 'students' && user.drivingSchoolId !== null) ||
        (userFilter.value === 'instructors' && user.instructorSchoolId !== null) ||
        (userFilter.value === 'managers' && user.managedSchool !== null) ||
        (userFilter.value === 'admins' && user.role === 'ADMIN') ||
        (userFilter.value === 'applicants' &&
          applications.value.some((application) => application.userId === user.id)))
  )
)

const relationshipLabels = (user: AdminUser) =>
  userRelationshipLabel(
    user,
    applications.value.some((application) => application.userId === user.id)
  )
</script>
<template>
  <section aria-labelledby="admin-users-title">
    <div class="dh-admin-heading">
      <div>
        <h2 id="admin-users-title">People & accounts</h2>
        <p>
          Manage contact details and school membership. Admin identities are managed through the
          CLI.
        </p>
      </div>
      <button class="dh-admin-button" @click="emit('edit', 'users')">+ Add user</button>
    </div>
    <div class="dh-admin-toolbar">
      <label>
        Search users
        <input v-model="search" type="search" placeholder="Name or email" />
      </label>
      <label>
        Relationship
        <select v-model="userFilter">
          <option value="all">All users</option>
          <option value="students">Students</option>
          <option value="instructors">Instructors</option>
          <option value="managers">Managers</option>
          <option value="applicants">Applicants</option>
          <option value="admins">Administrators</option>
        </select>
      </label>
      <span>{{ visibleUsers.length }} users</span>
    </div>
    <div class="dh-admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Relationships</th>
            <th>Student school</th>
            <th>Instructor school</th>
            <th>Managed school</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in visibleUsers" :key="user.id">
            <td>
              <strong>{{ user.name }}</strong>
              <small>{{ user.email }}</small>
            </td>
            <td>
              <span class="dh-admin-tag">{{ relationshipLabels(user) }}</span>
            </td>
            <td>{{ schoolName(user.drivingSchoolId) }}</td>
            <td>{{ schoolName(user.instructorSchoolId) }}</td>
            <td>{{ schoolName(user.managedSchool?.id ?? null) }}</td>
            <td>
              <div v-if="user.role === 'USER'" class="dh-admin-actions">
                <button :aria-label="`Edit ${user.name}`" @click="emit('edit', 'users', user.id)">
                  Edit
                </button>
                <button
                  class="danger"
                  :aria-label="`Delete ${user.name}`"
                  @click="emit('delete', 'users', user.id, user.name)"
                >
                  Delete
                </button>
              </div>
              <span v-else class="dh-admin-muted">CLI only</span>
            </td>
          </tr>
          <tr v-if="!visibleUsers.length">
            <td colspan="6" class="dh-admin-empty">No users match these filters.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
