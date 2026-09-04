import type { AdminDeleteRequest, AdminOverview, AdminResource, AdminUser } from '~/types/admin'

export function matchesAdminSearch(search: string, ...values: (string | null)[]) {
  return values.join(' ').toLowerCase().includes(search.trim().toLowerCase())
}

export function userRelationshipLabel(user: AdminUser, isApplicant: boolean) {
  const relationships = [
    user.drivingSchoolId !== null ? 'Student' : '',
    user.instructorSchoolId !== null ? 'Instructor' : '',
    user.managedSchool ? 'Manager' : ''
  ].filter(Boolean)
  if (relationships.length) return relationships.join(' · ')
  if (user.role === 'ADMIN') return 'Administrator'
  return isApplicant ? 'Applicant' : 'Account'
}

export function describeAdminDeletion(
  overview: AdminOverview,
  resource: AdminResource,
  id: number,
  name: string
): AdminDeleteRequest {
  let impact = 'This record will be permanently deleted.'
  if (resource === 'users') {
    const count = overview.applications.filter((application) => application.userId === id).length
    impact = `This user and their ${count} application(s) will be permanently deleted. Their school-manager, vehicle-instructor and preferred-instructor assignments will be cleared. Schools and vehicles will remain.`
  } else if (resource === 'schools') {
    const students = overview.users.filter((user) => user.drivingSchoolId === id).length
    const instructors = overview.users.filter((user) => user.instructorSchoolId === id).length
    const fleet = overview.vehicles.filter((vehicle) => vehicle.drivingSchoolId === id).length
    const requests = overview.applications.filter(
      (application) => application.drivingSchoolId === id
    ).length
    impact = `This school, ${fleet} vehicle(s), and ${requests} application(s) will be permanently deleted. ${students} student(s) and ${instructors} instructor(s) will be unassigned. User accounts will remain.`
  } else if (resource === 'applications') {
    impact =
      'This application will be permanently deleted. Existing student enrollment will remain; change it in Users if needed.'
  }
  return { resource, id, name, impact }
}
