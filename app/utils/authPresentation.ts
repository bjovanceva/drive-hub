/** Returns a safe, same-origin path from a redirect query parameter. */
export function safeRedirect(value: unknown, fallback: string) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : fallback
}

/** Extracts a server validation message without coupling forms to FetchError. */
export function authErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null) return fallback

  if ('name' in error && error.name === 'FetchError' && !('statusCode' in error && error.statusCode)) {
    return 'Cannot reach the server. Check your connection and try again.'
  }

  const data = 'data' in error && typeof error.data === 'object' && error.data !== null
    ? error.data
    : error

  if ('statusCode' in data && typeof data.statusCode === 'number' && data.statusCode >= 500) return fallback
  const fieldMessage = Object.values(authFieldErrors(error))[0]
  if (fieldMessage) return fieldMessage
  if ('statusMessage' in data && data.statusMessage === 'Validation Error') return 'Check the details you entered and try again.'
  if ('statusCode' in error && error.statusCode === 0) return 'Cannot reach the server. Check your connection and try again.'
  if ('statusMessage' in data && typeof data.statusMessage === 'string') return data.statusMessage
  if ('message' in data && typeof data.message === 'string') return data.message
  return fallback
}

/** Read only public account field errors returned by the authentication API. */
export function authFieldErrors(error: unknown): Record<string, string> {
  if (typeof error !== 'object' || error === null || !('data' in error)) return {}
  const response = error.data
  if (typeof response !== 'object' || response === null || !('data' in response)) return {}
  const details = response.data
  if (typeof details !== 'object' || details === null || !('fieldErrors' in details)) return {}
  const fields = details.fieldErrors
  if (typeof fields !== 'object' || fields === null) return {}
  return Object.fromEntries(Object.entries(fields).filter(([key, value]) =>
    ['name', 'email', 'password'].includes(key) && typeof value === 'string'))
}
