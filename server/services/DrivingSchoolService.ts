import {
  DrivingSchoolRepository,
  type CreateDrivingSchoolData,
  type DrivingSchoolFilters
} from '../repositories/DrivingSchoolRepository'

export interface CreateDrivingSchoolCommand {
  name: string
  email: string
  address: string
  description?: string
  phone: string
  city?: string
  managerId?: number
  createdAt?: string | Date
  categoryIds?: number[]
}

/** Applies validation and business rules before school data reaches Prisma. */
export class DrivingSchoolService {
  private repository: DrivingSchoolRepository

  constructor() {
    this.repository = new DrivingSchoolRepository()
  }

  async getAllDrivingSchools(filters: DrivingSchoolFilters = {}) {
    return this.repository.findAll(filters)
  }

  async getDrivingSchool(id: number) {
    const school = await this.repository.findById(id)

    if (!school) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Driving school not found'
      })
    }

    return school
  }

  async createDrivingSchool(command: CreateDrivingSchoolCommand) {
    const name = command.name?.trim()
    const email = command.email?.trim().toLowerCase()
    const address = command.address?.trim()
    const phone = command.phone?.trim()
    const city = command.city?.trim() || this.cityFromAddress(address)

    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name is required'
      })
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A valid email is required'
      })
    }

    if (!address || !phone) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Address and phone are required'
      })
    }

    if (await this.repository.findByEmail(email)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A driving school with this email already exists'
      })
    }

    const createdAt = command.createdAt ? new Date(command.createdAt) : new Date()
    if (Number.isNaN(createdAt.getTime())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'createdAt must be a valid date'
      })
    }

    const managerId = command.managerId
    if (!Number.isInteger(managerId) || managerId! <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A school manager must be selected'
      })
    }

    const selectedUser = await this.repository.getUserById(managerId)
    if (!selectedUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Selected manager user was not found'
      })
    }

    if (selectedUser.managedSchool) {
      throw createError({
        statusCode: 409,
        statusMessage: 'This user already manages another driving school'
      })
    }

    const requestedCategoryIds = command.categoryIds ?? []
    if (requestedCategoryIds.some(id => !Number.isInteger(id) || id <= 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Category IDs must be positive integers'
      })
    }

    const categoryIds = [...new Set(requestedCategoryIds)]

    if (categoryIds.length && await this.repository.countCategories(categoryIds) !== categoryIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'One or more category IDs do not exist'
      })
    }

    const data: CreateDrivingSchoolData = {
      name,
      email,
      address,
      phone,
      city,
      managerId,
      createdAt,
      description: command.description?.trim() || undefined,
      categoryIds
    }

    return this.repository.create(data)
  }

  async deleteDrivingSchool(id: number) {
    await this.getDrivingSchool(id)

    try {
      const deleted = await this.repository.delete(id)
      return { id: deleted.id }
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2003') {
        throw createError({
          statusCode: 409,
          statusMessage: 'Driving school cannot be deleted while related records exist'
        })
      }

      throw error
    }
  }

  /** Uses the final address segment as a compatibility fallback for old forms. */
  private cityFromAddress(address?: string) {
    if (!address) return undefined
    return address.split(',').at(-1)?.trim() || undefined
  }
}
