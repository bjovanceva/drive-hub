/** Clears the current public-app session cookie. */
export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { success: true }
})
