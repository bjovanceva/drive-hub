<script setup lang="ts">
import AdminModal from './AdminModal.vue'
import AdminUserForm from './forms/AdminUserForm.vue'
import AdminSchoolForm from './forms/AdminSchoolForm.vue'
import AdminApplicationForm from './forms/AdminApplicationForm.vue'
import AdminVehicleForm from './forms/AdminVehicleForm.vue'
import type { AdminOverview, AdminEditorState, AdminFormState } from '~/types/admin'
import { createAdminForm } from '~/utils/admin/forms'

const props = defineProps<{
  overview: AdminOverview
  editor: AdminEditorState
  busy: boolean
  error: string
}>()
const emit = defineEmits<{ close: []; save: [form: AdminFormState] }>()
const form = ref(createAdminForm(props.editor, props.overview))
const titles = {
  users: 'user',
  schools: 'school',
  applications: 'application',
  vehicles: 'vehicle'
}
const title = `${props.editor.id === null ? 'Add' : 'Edit'} ${titles[props.editor.resource]}`
</script>

<template>
  <AdminModal :title="title" :busy="busy" @close="emit('close')">
    <form @submit.prevent="emit('save', form)">
      <fieldset :disabled="busy">
        <AdminUserForm
          v-if="form.resource === 'users'"
          v-model="form.value"
          :overview="overview"
          :id="editor.id"
        />
        <AdminSchoolForm
          v-else-if="form.resource === 'schools'"
          v-model="form.value"
          :overview="overview"
          :id="editor.id"
        />
        <AdminApplicationForm
          v-else-if="form.resource === 'applications'"
          v-model="form.value"
          :overview="overview"
          :id="editor.id"
        />
        <AdminVehicleForm v-else v-model="form.value" :overview="overview" :id="editor.id" />
        <p v-if="error" class="dh-admin-error" role="alert">{{ error }}</p>
        <footer>
          <button
            type="button"
            class="dh-admin-button dh-admin-button--secondary"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button type="submit" class="dh-admin-button">
            {{ busy ? 'Saving…' : 'Save changes' }}
          </button>
        </footer>
      </fieldset>
    </form>
  </AdminModal>
</template>
