import type { SchoolSearchOptionsDto } from '~/types/search-options'

/**
 * Fetches the location and licence choices shared by every school search form.
 * Keeping this request in one composable prevents pages from rebuilding option
 * lists from static presentation data or from raw school responses.
 */
export function useSchoolSearchOptions() {
  const request = useFetch<SchoolSearchOptionsDto>('/api/search-options', {
    default: () => ({ locations: [], categories: [] })
  })

  return {
    locationOptions: computed(() => request.data.value.locations),
    categoryOptions: computed(() => request.data.value.categories),
    status: request.status,
    error: request.error,
    refresh: request.refresh
  }
}
