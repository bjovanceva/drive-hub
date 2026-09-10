import { ApplicationRepository } from '../repositories/ApplicationRepository'

/** Validates and creates applications for authenticated ordinary users. */
export class ApplicationService {
  private repository = new ApplicationRepository()

  async createApplication(userId: number, drivingSchoolId: unknown, categoryId: unknown, preferredInstructorId: unknown) {
    const parsedSchoolId = Number(drivingSchoolId)
    const parsedCategoryId = Number(categoryId)
    const parsedInstructorId = preferredInstructorId == null || preferredInstructorId === '' ? null : Number(preferredInstructorId)

    if (!Number.isInteger(parsedSchoolId) || parsedSchoolId <= 0 || !Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0 || (parsedInstructorId !== null && (!Number.isInteger(parsedInstructorId) || parsedInstructorId <= 0))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A valid driving school and category must be selected'
      })
    }

    if (await this.repository.hasSchoolMembership(userId)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Users who already belong to a driving school cannot submit applications'
      })
    }

    if (parsedInstructorId !== null && !await this.repository.instructorBelongsToSchool(parsedInstructorId, parsedSchoolId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'The selected instructor is not provided by this driving school'
      })
    }

    if (!await this.repository.categoryBelongsToSchool(parsedSchoolId, parsedCategoryId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'The selected category is not offered by this driving school'
      })
    }

    const existingApplication = await this.repository.findDuplicate(userId, parsedSchoolId, parsedCategoryId)
    if (existingApplication?.status === 'PENDING' || existingApplication?.status === 'APPROVED') {
      throw createError({
        statusCode: 409,
        statusMessage: 'You have already applied to this school for this category'
      })
    }

    if (existingApplication) {
      return this.repository.restart(existingApplication.id, parsedInstructorId)
    }

    try {
      return await this.repository.create(userId, parsedSchoolId, parsedCategoryId, parsedInstructorId)
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw createError({
          statusCode: 409,
          statusMessage: 'You have already applied to this school for this category'
        })
      }

      throw error
    }
  }
}
