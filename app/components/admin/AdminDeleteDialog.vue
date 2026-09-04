<script setup lang="ts">
import AdminModal from './AdminModal.vue'
import type { AdminDeleteRequest } from '~/types/admin'
defineProps<{ request: AdminDeleteRequest; busy: boolean; error: string }>()
defineEmits<{ close: []; confirm: [] }>()
</script>
<template>
  <AdminModal
    class="dh-admin-dialog--delete"
    :title="`Delete ${request.name}?`"
    eyebrow="Confirm deletion"
    :busy="busy"
    hide-close
    @close="$emit('close')"
  >
    <p class="dh-admin-delete-impact">{{ request.impact }}</p>
    <p v-if="error" class="dh-admin-error" role="alert">{{ error }}</p>
    <footer>
      <button
        class="dh-admin-button dh-admin-button--secondary"
        :disabled="busy"
        autofocus
        @click="$emit('close')"
      >
        Cancel
      </button>
      <button
        class="dh-admin-button dh-admin-button--danger"
        :disabled="busy"
        @click="$emit('confirm')"
      >
        {{ busy ? 'Deleting…' : 'Delete permanently' }}
      </button>
    </footer>
  </AdminModal>
</template>
