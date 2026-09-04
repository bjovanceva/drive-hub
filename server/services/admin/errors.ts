import { createError } from 'h3'
export function readableAdminError(error: unknown) {
  const code = (error as { code?: string })?.code
  const messages: Record<string, string> = {
    P2002:
      'A record with these unique details already exists (email, registration, manager, or applicant/school/category).',
    P2003: 'A related record changed or is still in use. Refresh and try again.',
    P2025: 'This record no longer exists. Refresh the list.',
    P2034: 'Another administrator changed these records. Refresh and try again.'
  }
  if (code && messages[code])
    return createError({ statusCode: code === 'P2025' ? 404 : 409, statusMessage: messages[code] })
  if (error && typeof error === 'object' && 'issues' in error)
    return createError({
      statusCode: 400,
      statusMessage:
        (error as { issues: { message: string }[] }).issues[0]?.message ?? 'Check the form fields.'
    })
  return error
}
