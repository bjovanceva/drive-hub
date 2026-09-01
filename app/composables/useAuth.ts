interface LoginInput {
  email: string
  password: string
}

interface RegisterInput extends LoginInput {
  name: string
}

/**
 * Wraps Nuxt Auth Utils with Drive Hub's public login, registration and logout
 * endpoints while keeping session refresh and mutation state in one place.
 */
export function useAuth() {
  const session = useUserSession()
  const mutationStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const mutationError = shallowRef<unknown>(null)

  async function runMutation<T>(operation: () => Promise<T>) {
    mutationStatus.value = 'pending'
    mutationError.value = null

    try {
      const result = await operation()
      await session.fetch()
      mutationStatus.value = 'success'
      return result
    } catch (error) {
      mutationError.value = error
      mutationStatus.value = 'error'
      throw error
    }
  }

  function login(input: LoginInput) {
    return runMutation(() => $fetch('/api/auth/login', {
      method: 'POST',
      body: input
    }))
  }

  function register(input: RegisterInput) {
    return runMutation(() => $fetch('/api/auth/register', {
      method: 'POST',
      body: input
    }))
  }

  function logout() {
    return runMutation(() => $fetch('/api/auth/logout', { method: 'POST' }))
  }

  return {
    user: session.user,
    loggedIn: session.loggedIn,
    sessionReady: session.ready,
    login,
    register,
    logout,
    mutationStatus: readonly(mutationStatus),
    mutationError: readonly(mutationError)
  }
}
