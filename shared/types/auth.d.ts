export type AppUserRole = 'USER' | 'ADMIN'

declare module '#auth-utils' {
  interface User {
    id: number
    name: string
    email: string
    role: AppUserRole
    studentSchoolId: number | null
    instructorSchoolId: number | null
    managedSchoolId: number | null
  }

  interface UserSession {
    loggedInAt: string
  }
}

export {}
