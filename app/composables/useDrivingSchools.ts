import type { MaybeRefOrGetter } from 'vue'
import type {
  CreateDrivingSchoolInput,
  DeleteDrivingSchoolResponseDto,
  DrivingSchoolDto
} from '~/types/driving-school'

export interface UseDrivingSchoolsOptions {
  location?: MaybeRefOrGetter<string | undefined>
  category?: MaybeRefOrGetter<string | undefined>
}

/**
 * Owns all client access to /api/driving-schools.
 *
 * Pages provide optional reactive filters and receive a shared AsyncData state.
 * Mutations refresh the current query automatically, so consumers do not need
 * to duplicate request URLs, loading state, or cache-refresh logic.
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

  const mutationStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const mutationError = shallowRef<unknown>(null)

  async function runMutation<T>(operation: () => Promise<T>) {
    mutationStatus.value = 'pending'
    mutationError.value = null

    try {
      const result = await operation()
      await request.refresh()
      mutationStatus.value = 'success'
      return result
    } catch (error) {
      mutationError.value = error
      mutationStatus.value = 'error'
      throw error
    }
  }

  function createDrivingSchool(input: CreateDrivingSchoolInput) {
    return runMutation(() => $fetch<DrivingSchoolDto>('/api/driving-schools', {
      method: 'POST',
      body: input
    }))
  }

  function deleteDrivingSchool(id: number) {
    return runMutation(async () => {
      if (!Number.isInteger(id) || id <= 0) {
        throw new TypeError('Driving school ID must be a positive integer')
      }

      return $fetch<DeleteDrivingSchoolResponseDto>(`/api/driving-schools/${id}`, {
        method: 'DELETE'
      })
    })
  }

  return {
    schools: request.data,
    status: request.status,
    error: request.error,
    refresh: request.refresh,
    createDrivingSchool,
    deleteDrivingSchool,
    mutationStatus: readonly(mutationStatus),
    mutationError: readonly(mutationError)
  }
}
