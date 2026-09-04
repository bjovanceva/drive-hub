import type { AdminEditorState, AdminFormState, AdminOverview } from '~/types/admin'

/** Copy editable fields only; forms never mutate the loaded directory. */
export function createAdminForm(editor: AdminEditorState, overview: AdminOverview): AdminFormState {
  switch (editor.resource) {
    case 'users': {
      const user = overview.users.find((user) => user.id === editor.id)
      return {
        resource: 'users',
        value: {
          name: user?.name ?? '',
          email: user?.email ?? '',
          password: '',
          studentSchoolId: user?.drivingSchoolId ?? null,
          instructorSchoolId: user?.instructorSchoolId ?? null,
          managedSchoolId: user?.managedSchool?.id ?? null
        }
      }
    }
    case 'schools': {
      const school = overview.schools.find((school) => school.id === editor.id)
      return {
        resource: 'schools',
        value: {
          name: school?.name ?? '',
          email: school?.email ?? '',
          phone: school?.phone ?? '',
          address: school?.address ?? '',
          city: school?.city ?? '',
          description: school?.description ?? '',
          managerId: school?.managerId ?? null,
          categoryIds: school?.categories.map((category) => category.id) ?? []
        }
      }
    }
    case 'applications': {
      const application = overview.applications.find((application) => application.id === editor.id)
      return {
        resource: 'applications',
        value: {
          userId: application?.userId ?? null,
          drivingSchoolId: application?.drivingSchoolId ?? editor.schoolId ?? null,
          categoryId: application?.categoryId ?? null,
          preferredInstructorId: application?.preferredInstructorId ?? null,
          status: application?.status ?? 'PENDING'
        }
      }
    }
    case 'vehicles': {
      const vehicle = overview.vehicles.find((vehicle) => vehicle.id === editor.id)
      return {
        resource: 'vehicles',
        value: {
          registration: vehicle?.registration ?? '',
          brand: vehicle?.brand ?? '',
          model: vehicle?.model ?? '',
          year: vehicle?.year ?? new Date().getFullYear(),
          drivingSchoolId: vehicle?.drivingSchoolId ?? editor.schoolId ?? null,
          instructorId: vehicle?.instructorId ?? null
        }
      }
    }
  }
}

export function adminFormPayload(form: AdminFormState) {
  if (form.resource === 'users') {
    const { password, ...profile } = form.value
    return { ...profile, ...(password ? { password } : {}) }
  }
  return { ...form.value }
}
