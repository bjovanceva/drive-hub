<script setup lang="ts">
import type { AdminOverview, AdminResource } from '~/types/admin'
import { matchesAdminSearch } from '~/utils/admin/presentation'
const props = defineProps<{ overview: AdminOverview }>()
const emit = defineEmits<{
  edit: [resource: AdminResource, id?: number | null]
  delete: [resource: AdminResource, id: number, name: string]
}>()
const { userName, schoolName, categoryName } = useAdminDirectory(() => props.overview)
const users = computed(() => props.overview.users)
const schools = computed(() => props.overview.schools)
const applications = computed(() => props.overview.applications)
const search = ref('')
const matches = (...values: (string | null)[]) => matchesAdminSearch(search.value, ...values)

const route = useRoute()
const applicationStatus = ref('all')
const applicationSchool = computed({
  get: () =>
    schools.value.some((school) => school.id === Number(route.query.school))
      ? Number(route.query.school)
      : null,
  set: (school: number | null) => {
    navigateTo({ query: { section: 'applications', ...(school === null ? {} : { school }) } })
  }
})
const visibleApplications = computed(() =>
  applications.value.filter(
    (application) =>
      matches(
        userName(application.userId),
        users.value.find((user) => user.id === application.userId)?.email ?? '',
        schoolName(application.drivingSchoolId)
      ) &&
      (applicationStatus.value === 'all' || application.status === applicationStatus.value) &&
      (applicationSchool.value === null || application.drivingSchoolId === applicationSchool.value)
  )
)
</script>
<template>
  <section aria-labelledby="admin-applicants-title">
    <div class="dh-admin-heading">
      <div>
        <h2 id="admin-applicants-title">Applicants & applications</h2>
        <p>
          {{ applications.filter((application) => application.status === 'PENDING').length }}
          pending applications. Review requests and manage enrollment.
        </p>
      </div>
      <button class="dh-admin-button" @click="emit('edit', 'applications')">
        + Add application
      </button>
    </div>
    <div class="dh-admin-toolbar">
      <label>
        Search applicants
        <input v-model="search" type="search" placeholder="Name, email or school" />
      </label>
      <label>
        School
        <select v-model="applicationSchool">
          <option :value="null">All schools</option>
          <option v-for="item in schools" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </label>
      <label>
        Status
        <select v-model="applicationStatus">
          <option value="all">All statuses</option>
          <option>PENDING</option>
          <option>APPROVED</option>
          <option>REJECTED</option>
          <option>CANCELLED</option>
        </select>
      </label>
    </div>
    <div class="dh-admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Applicant</th>
            <th>School / category</th>
            <th>Preferred instructor</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="application in visibleApplications" :key="application.id">
            <td>
              <strong>{{ userName(application.userId) }}</strong>
              <small>{{ users.find((user) => user.id === application.userId)?.email }}</small>
            </td>
            <td>
              {{ schoolName(application.drivingSchoolId) }}
              <small>Category {{ categoryName(application.categoryId) }}</small>
            </td>
            <td>{{ userName(application.preferredInstructorId) }}</td>
            <td>
              <span
                class="dh-admin-tag"
                :class="`dh-admin-tag--${application.status.toLowerCase()}`"
              >
                {{ application.status }}
              </span>
            </td>
            <td>
              {{ new Date(application.startedAt).toLocaleDateString('en-GB', { timeZone: 'UTC' }) }}
            </td>
            <td>
              <div class="dh-admin-actions">
                <button
                  :aria-label="`Review application ${application.id}`"
                  @click="emit('edit', 'applications', application.id)"
                >
                  Review
                </button>
                <button
                  class="danger"
                  :aria-label="`Delete application ${application.id}`"
                  @click="
                    emit('delete', 'applications', application.id, `Application #${application.id}`)
                  "
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!visibleApplications.length">
            <td colspan="6" class="dh-admin-empty">No applications match these filters.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
