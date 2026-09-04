export type AdminResource = 'users' | 'schools' | 'applications' | 'vehicles'
export interface AdminUser {
  id: number
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  drivingSchoolId: number | null
  instructorSchoolId: number | null
  managedSchool: { id: number } | null
}
export interface AdminSchool {
  id: number
  name: string
  email: string
  phone: string
  address: string
  city: string | null
  description: string | null
  managerId: number | null
  categories: { id: number }[]
  createdAt: string
}
export interface AdminApplication {
  id: number
  userId: number
  drivingSchoolId: number
  categoryId: number
  preferredInstructorId: number | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  startedAt: string
}
export interface AdminVehicle {
  id: number
  registration: string
  brand: string
  model: string
  year: number
  drivingSchoolId: number
  instructorId: number | null
}
export interface AdminOverview {
  users: AdminUser[]
  schools: AdminSchool[]
  applications: AdminApplication[]
  vehicles: AdminVehicle[]
  categories: { id: number; name: string; code: string | null }[]
}
export interface AdminEditorState {
  resource: AdminResource
  id: number | null
  schoolId?: number
}

export type AdminSection = 'users' | 'schools' | 'applications'
export type SchoolMembership = 'student' | 'instructor'
export interface AdminDeleteRequest {
  resource: AdminResource
  id: number
  name: string
  impact: string
}
export interface AdminUserFormValue {
  name: string
  email: string
  password: string
  studentSchoolId: number | null
  instructorSchoolId: number | null
  managedSchoolId: number | null
}
export interface AdminSchoolFormValue {
  name: string
  email: string
  phone: string
  address: string
  city: string
  description: string
  managerId: number | null
  categoryIds: number[]
}
export interface AdminApplicationFormValue {
  userId: number | null
  drivingSchoolId: number | null
  categoryId: number | null
  preferredInstructorId: number | null
  status: AdminApplication['status']
}
export interface AdminVehicleFormValue {
  registration: string
  brand: string
  model: string
  year: number
  drivingSchoolId: number | null
  instructorId: number | null
}
export type AdminFormState =
  | { resource: 'users'; value: AdminUserFormValue }
  | { resource: 'schools'; value: AdminSchoolFormValue }
  | { resource: 'applications'; value: AdminApplicationFormValue }
  | { resource: 'vehicles'; value: AdminVehicleFormValue }
