<script setup lang="ts">
import AdminUsersPanel from '~/components/admin/AdminUsersPanel.vue'
import AdminSchoolsPanel from '~/components/admin/AdminSchoolsPanel.vue'
import AdminSchoolDetail from '~/components/admin/AdminSchoolDetail.vue'
import AdminApplicationsPanel from '~/components/admin/AdminApplicationsPanel.vue'
import AdminEditor from '~/components/admin/AdminEditor.vue'
import AdminDeleteDialog from '~/components/admin/AdminDeleteDialog.vue'
import type { AdminResource, AdminSection } from '~/types/admin'

definePageMeta({ layout: 'default', middleware: 'admin' })
useSeoMeta({ title: 'Administration | Drive Hub' })
const route = useRoute()
const {
  data,
  error,
  status,
  refresh,
  editor,
  deletion,
  busy,
  notice,
  mutationError,
  close,
  edit,
  askDelete,
  save,
  remove,
  assign
} = await useAdminWorkspace()
const sections: { id: AdminSection; label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'schools', label: 'Schools' },
  { id: 'applications', label: 'Applicants' }
]
const section = computed(
  () => sections.find((item) => item.id === route.query.section)?.id ?? 'users'
)
const school = computed(() =>
  data.value?.schools.find((item) => item.id === Number(route.query.school))
)
function editAtSchool(resource: AdminResource, id: number | null = null) {
  edit(resource, id, school.value?.id)
}
watch(
  () => route.fullPath,
  () => {
    close()
    notice.value = ''
  }
)
onBeforeRouteLeave(() => !busy.value)
onBeforeRouteUpdate(() => !busy.value)
</script>
<template>
  <div class="dh-admin">
    <AppToast
      :message="mutationError || notice"
      :tone="mutationError ? 'error' : 'success'"
      @close="mutationError = ''; notice = ''"
    />
    <header class="dh-admin-hero">
      <div>
        <p>Drive Hub / Operations</p>
        <h1>Administration</h1>
        <span>Manage people, schools, and every connection between them.</span>
      </div>
      <span class="dh-admin-badge">Admin workspace</span>
    </header>
    <div class="dh-admin-body">
      <nav class="dh-admin-tabs" aria-label="Administration sections">
        <NuxtLink
          v-for="item in sections"
          :key="item.id"
          :to="{ query: { section: item.id } }"
          :class="{ active: section === item.id }"
          :aria-current="section === item.id ? 'page' : undefined"
        >
          {{ item.label }}
          <span>{{ data?.[item.id].length ?? 0 }}</span>
        </NuxtLink>
      </nav>
      <div v-if="error" class="dh-admin-empty">
        <h2>Unable to load administration</h2>
        <p>Please check your connection and administrator access.</p>
        <button class="dh-admin-button" @click="refresh()">Try again</button>
      </div>
      <div v-else-if="!data" class="dh-admin-empty" role="status">
        {{ status === 'pending' ? 'Loading administration…' : 'No data available.' }}
      </div>
      <template v-else>
        <AdminUsersPanel
          v-if="section === 'users'"
          :overview="data"
          @edit="edit"
          @delete="askDelete"
        />
        <template v-else-if="section === 'schools'">
          <AdminSchoolDetail
            v-if="school"
            :key="school.id"
            :overview="data"
            :school="school"
            :busy="busy"
            @edit="editAtSchool"
            @delete="askDelete"
            @assign="assign"
          />
          <AdminSchoolsPanel v-else :overview="data" @edit="edit" @delete="askDelete" />
        </template>
        <AdminApplicationsPanel v-else :overview="data" @edit="edit" @delete="askDelete" />
        <AdminEditor
          v-if="editor"
          :key="`${editor.resource}-${editor.id}`"
          :overview="data"
          :editor="editor"
          :busy="busy"
          :error="mutationError"
          @close="close"
          @save="save"
        />
      </template>
      <AdminDeleteDialog
        v-if="deletion"
        :request="deletion"
        :busy="busy"
        :error="mutationError"
        @close="close"
        @confirm="remove"
      />
    </div>
  </div>
</template>
<style src="~/assets/css/admin.css"></style>
