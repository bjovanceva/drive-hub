<script setup lang="ts">
import type { AdminOverview, AdminResource } from '~/types/admin'
import { matchesAdminSearch } from '~/utils/admin/presentation'
const props = defineProps<{ overview: AdminOverview }>()
const emit = defineEmits<{
  edit: [resource: AdminResource, id?: number | null]
  delete: [resource: AdminResource, id: number, name: string]
}>()
const { userName } = useAdminDirectory(() => props.overview)
const users = computed(() => props.overview.users)
const schools = computed(() => props.overview.schools)
const search = ref('')
const matches = (...values: (string | null)[]) => matchesAdminSearch(search.value, ...values)
const visibleSchools = computed(() =>
  schools.value.filter((school) => matches(school.name, school.city, userName(school.managerId)))
)
</script>
<template>
  <section aria-labelledby="admin-schools-title">
    <div class="dh-admin-heading">
      <div>
        <h2 id="admin-schools-title">School network</h2>
        <p>Open a school to manage its people, programmes and fleet.</p>
      </div>
      <button class="dh-admin-button" @click="emit('edit', 'schools')">+ Add school</button>
    </div>
    <div class="dh-admin-toolbar">
      <label>
        Search schools
        <input v-model="search" type="search" placeholder="School, city or manager" />
      </label>
      <span>{{ visibleSchools.length }} schools</span>
    </div>
    <div class="dh-admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>School</th>
            <th>Manager</th>
            <th>Students</th>
            <th>Instructors</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in visibleSchools" :key="item.id">
            <td>
              <NuxtLink class="dh-admin-school-link" :to="{ query: { section: 'schools', school: item.id } }">
                {{ item.name }} →
              </NuxtLink>
              <small>{{ item.city || item.address }}</small>
            </td>
            <td :class="{
              'missing-manager': ['Unassigned', 'Unknown user'].includes(userName(item.managerId))
            }">
              {{ userName(item.managerId) }}
            </td>
            <td>{{users.filter((user) => user.drivingSchoolId === item.id).length}}</td>
            <td>{{users.filter((user) => user.instructorSchoolId === item.id).length}}</td>
            <td>
              <div class="dh-admin-actions">
                <button :aria-label="`Edit ${item.name}`" @click="emit('edit', 'schools', item.id)">
                  Edit
                </button>
                <button class="danger" :aria-label="`Delete ${item.name}`"
                  @click="emit('delete', 'schools', item.id, item.name)">
                  Delete
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!visibleSchools.length">
            <td colspan="5" class="dh-admin-empty">No schools match these filters.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.missing-manager {
  color: #a52d20;
}
</style>
