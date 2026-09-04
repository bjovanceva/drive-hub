<script setup lang="ts">
import AdminSchoolRoster from './AdminSchoolRoster.vue'
import type { AdminOverview, AdminResource, AdminSchool, SchoolMembership } from '~/types/admin'
const props = defineProps<{ overview: AdminOverview; school: AdminSchool; busy: boolean }>()
const emit = defineEmits<{
  edit: [resource: AdminResource, id?: number | null]
  delete: [resource: AdminResource, id: number, name: string]
  assign: [kind: SchoolMembership, userId: number, schoolId: number]
}>()
const { userName, categoryName } = useAdminDirectory(() => props.overview)
const applications = computed(() => props.overview.applications)
const schoolVehicles = computed(() =>
  props.overview.vehicles.filter((vehicle) => vehicle.drivingSchoolId === props.school.id)
)
</script>
<template>
  <section aria-labelledby="admin-schools-title">
    <NuxtLink class="dh-admin-back" :to="{ query: { section: 'schools' } }">← All schools</NuxtLink>
    <div class="dh-admin-heading">
      <div>
        <h2 id="admin-schools-title">{{ school.name }}</h2>
        <p>{{ school.address }} · {{ school.city }} · {{ school.email }}</p>
      </div>
      <div class="dh-admin-actions">
        <button class="dh-admin-button" @click="emit('edit', 'schools', school.id)">
          Edit school
        </button>
        <button class="danger" @click="emit('delete', 'schools', school.id, school.name)">
          Delete school
        </button>
      </div>
    </div>
    <div class="dh-admin-school-summary">
      <div>
        <span>School manager</span>
        <strong>{{ userName(school.managerId) }}</strong>
        <button v-if="school.managerId" @click="emit('edit', 'users', school.managerId)">
          Edit manager
        </button>
        <button v-else @click="emit('edit', 'schools', school.id)">Assign manager</button>
      </div>
      <div>
        <span>Offered categories</span>
        <strong>
          {{
            school.categories.map((category) => categoryName(category.id)).join(' · ') || 'None yet'
          }}
        </strong>
        <button @click="emit('edit', 'schools', school.id)">Manage categories</button>
      </div>
      <div>
        <span>Applications</span>
        <strong>
          {{
            applications.filter((application) => application.drivingSchoolId === school.id).length
          }}
        </strong>
        <button @click="navigateTo({ query: { section: 'applications', school: school.id } })">
          View applicants
        </button>
      </div>
    </div>
    <div class="dh-admin-rosters">
      <AdminSchoolRoster
        kind="student"
        :school="school"
        :overview="overview"
        :busy="busy"
        @edit="emit('edit', 'users', $event)"
        @assign="(kind, userId) => emit('assign', kind, userId, school.id)"
      />
      <AdminSchoolRoster
        kind="instructor"
        :school="school"
        :overview="overview"
        :busy="busy"
        @edit="emit('edit', 'users', $event)"
        @assign="(kind, userId) => emit('assign', kind, userId, school.id)"
      />
    </div>
    <div class="dh-admin-heading">
      <div>
        <h3>School fleet</h3>
        <p>Manage vehicles and assign instructors from this school.</p>
      </div>
      <button class="dh-admin-button" @click="emit('edit', 'vehicles')">+ Add vehicle</button>
    </div>
    <div class="dh-admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Registration</th>
            <th>Vehicle</th>
            <th>Instructor</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="vehicle in schoolVehicles" :key="vehicle.id">
            <td>
              <strong>{{ vehicle.registration }}</strong>
            </td>
            <td>{{ vehicle.brand }} {{ vehicle.model }} · {{ vehicle.year }}</td>
            <td>{{ userName(vehicle.instructorId) }}</td>
            <td>
              <div class="dh-admin-actions">
                <button
                  :aria-label="`Edit ${vehicle.registration}`"
                  @click="emit('edit', 'vehicles', vehicle.id)"
                >
                  Edit
                </button>
                <button
                  class="danger"
                  :aria-label="`Delete ${vehicle.registration}`"
                  @click="emit('delete', 'vehicles', vehicle.id, vehicle.registration)"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!schoolVehicles.length">
            <td colspan="4" class="dh-admin-empty">No vehicles added yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
