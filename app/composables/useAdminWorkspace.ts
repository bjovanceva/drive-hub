import type {
  AdminOverview,
  AdminEditorState,
  AdminResource,
  AdminFormState,
  AdminDeleteRequest,
  SchoolMembership
} from '~/types/admin'
import { authErrorMessage } from '~/utils/authPresentation'
import { adminFormPayload } from '~/utils/admin/forms'
import { describeAdminDeletion } from '~/utils/admin/presentation'

export async function useAdminWorkspace() {
  const request = await useFetch<AdminOverview>('/api/admin/overview')
  // Dynamic admin resource paths make Nuxt's generated route matcher recursively
  // compare every API route in the project. Keep the payload types above, but use
  // a deliberately narrow transport signature for these runtime-built URLs.
  const adminMutationFetch = $fetch as unknown as (
    request: string,
    options: { method: 'POST' | 'PATCH' | 'DELETE'; body?: unknown }
  ) => Promise<unknown>
  const editor = ref<AdminEditorState | null>(null)
  const deletion = ref<AdminDeleteRequest | null>(null)
  const busy = ref(false)
  const notice = ref('')
  const mutationError = ref('')

  function close() {
    if (busy.value) return
    editor.value = null
    deletion.value = null
    mutationError.value = ''
  }
  function edit(resource: AdminResource, id: number | null = null, schoolId?: number) {
    if (busy.value) return
    close()
    notice.value = ''
    editor.value = { resource, id, schoolId }
  }
  function askDelete(resource: AdminResource, id: number, name: string) {
    if (busy.value || !request.data.value) return
    close()
    notice.value = ''
    deletion.value = describeAdminDeletion(request.data.value, resource, id, name)
  }
  async function mutate(action: () => Promise<unknown>, message: string) {
    if (busy.value) return
    busy.value = true
    mutationError.value = ''
    notice.value = ''
    try {
      await action()
      editor.value = null
      deletion.value = null
      await request.refresh()
      if (request.error.value) {
        mutationError.value =
          'Your changes were saved, but the list could not be refreshed. Please try loading it again.'
      } else notice.value = message
    } catch (cause) {
      mutationError.value = authErrorMessage(cause, 'Unable to save changes. Please try again.')
    } finally {
      busy.value = false
    }
  }
  async function save(form: AdminFormState) {
    const target = editor.value
    if (!target || form.resource !== target.resource) return
    const body = adminFormPayload(form)
    await mutate(
      () =>
        target.id === null
          ? adminMutationFetch(`/api/admin/${target.resource}`, { method: 'POST', body })
          : adminMutationFetch(`/api/admin/${target.resource}/${target.id}`, { method: 'PATCH', body }),
      'Changes saved.'
    )
  }
  async function remove() {
    const target = deletion.value
    if (!target) return
    await mutate(
      () => adminMutationFetch(`/api/admin/${target.resource}/${target.id}`, { method: 'DELETE' }),
      `${target.name} deleted.`
    )
  }
  async function assign(kind: SchoolMembership, userId: number, schoolId: number) {
    await mutate(
      () =>
        adminMutationFetch(`/api/admin/users/${userId}/membership`, {
          method: 'PATCH',
          body: { kind, schoolId }
        }),
      `User assigned as ${kind}.`
    )
  }
  return {
    ...request,
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
  }
}
