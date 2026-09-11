import type { MaybeRefOrGetter } from 'vue'
import type { DrivingSchoolDto } from '~/types/driving-school'

export interface UseDrivingSchoolsOptions {
  location?: MaybeRefOrGetter<string | undefined>
  category?: MaybeRefOrGetter<string | undefined>
}

/**
 * Owns all client access to /api/driving-schools.
 *
 * Pages provide optional reactive filters and receive a shared read-only
 * AsyncData state. School management lives in the dedicated admin workspace.
 */
export function useDrivingSchools(options: UseDrivingSchoolsOptions = {}) {
  const query = computed(() => {
    const location = toValue(options.location)
    const category = toValue(options.category)

    return {
      location: location && location !== 'all' ? location : undefined,
      category: category && category !== 'all' ? category : undefined
    }
  })

  const request = useFetch<DrivingSchoolDto[]>('/api/driving-schools', {
    query
  })

  return {
    schools: request.data,
    status: request.status,
    error: request.error,
    refresh: request.refresh
  }
}
