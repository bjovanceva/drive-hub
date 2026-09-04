import type { MaybeRefOrGetter } from 'vue'
import type { AdminOverview } from '~/types/admin'

/** Indexed display lookups shared by the admin lists and school detail view. */
export function useAdminDirectory(source: MaybeRefOrGetter<AdminOverview>) {
  const users = computed(() => new Map(toValue(source).users.map((user) => [user.id, user])))
  const schools = computed(
    () => new Map(toValue(source).schools.map((school) => [school.id, school]))
  )
  const categories = computed(
    () => new Map(toValue(source).categories.map((category) => [category.id, category]))
  )
  const userName = (id: number | null) =>
    id === null ? 'Unassigned' : (users.value.get(id)?.name ?? 'Unknown user')
  const schoolName = (id: number | null) =>
    id === null ? '—' : (schools.value.get(id)?.name ?? 'Unknown school')
  const categoryName = (id: number) =>
    categories.value.get(id)?.code ?? categories.value.get(id)?.name ?? '—'
  return { users, schools, categories, userName, schoolName, categoryName }
}
