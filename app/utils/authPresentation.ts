/** Returns a safe, same-origin path from a redirect query parameter. */
export function safeRedirect(value: unknown, fallback: string) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : fallback
}

/** Extracts a server validation message without coupling forms to FetchError. */
export function authErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null) return fallback

  const data = 'data' in error && typeof error.data === 'object' && error.data !== null
    ? error.data
    : error

  if ('statusMessage' in data && typeof data.statusMessage === 'string') return data.statusMessage
  if ('message' in data && typeof data.message === 'string') return data.message
  return fallback
}
