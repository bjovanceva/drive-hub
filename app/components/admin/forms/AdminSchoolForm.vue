<script setup lang="ts">
import type { AdminOverview, AdminSchoolFormValue } from '~/types/admin'
const props = defineProps<{ overview: AdminOverview; id: number | null }>()
const form = defineModel<AdminSchoolFormValue>({ required: true })
const ordinaryUsers = computed(() =>
  props.overview.users.filter(
    (user) =>
      user.role === 'USER' && user.drivingSchoolId === null && user.instructorSchoolId === null
  )
)
</script>
<template>
  <label>
    School name
    <input v-model="form.name" required minlength="2" maxlength="160" />
  </label>
  <div class="dh-admin-form-grid">
    <label>
      Email
      <input v-model.trim="form.email" type="email" required />
    </label>
    <label>
      Phone
      <input v-model="form.phone" required maxlength="50" />
    </label>
  </div>
  <label>
    Address
    <input v-model="form.address" required maxlength="240" />
  </label>
  <label>
    City
    <input v-model="form.city" maxlength="100" />
  </label>
  <label>
    Description
    <textarea v-model="form.description" rows="3" maxlength="4000" />
  </label>
  <label>
    School manager
    <select v-model="form.managerId">
      <option :value="null">No manager assigned</option>
      <option
        v-for="user in ordinaryUsers"
        :key="user.id"
        :value="user.id"
        :disabled="!!user.managedSchool && user.managedSchool.id !== id"
      >
        {{ user.name }} · {{ user.email
        }}{{
          user.managedSchool && user.managedSchool.id !== id ? ' (manages another school)' : ''
        }}
      </option>
    </select>
    <small>
      Students and instructors cannot also manage a school. Change their role in Users first.
    </small>
  </label>
  <fieldset class="dh-admin-checks">
    <legend>Offered categories</legend>
    <label v-for="category in overview.categories" :key="category.id">
      <input v-model="form.categoryIds" type="checkbox" :value="category.id" />
      {{ category.code }} · {{ category.name }}
    </label>
  </fieldset>
</template>
