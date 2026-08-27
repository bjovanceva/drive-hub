import { DrivingSchoolRepository } from '../repositories/DrivingSchoolRepository'

export class DrivingSchoolService {
  private repository: DrivingSchoolRepository

  constructor() {
    this.repository = new DrivingSchoolRepository()
  }

  async getAllDrivingSchools() {
    return this.repository.findAll()
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

  async createDrivingSchool(data: {
    name: string
    email: string
    address: string
    description?: string
    phone: string
    createdAt: Date
  }) {
    if (!data.name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name is required'
      })
    }

    return this.repository.create(data)
  }
}