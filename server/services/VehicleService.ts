import prisma from '../utils/prisma'
import { VehicleRepository } from '../repositories/VehicleRepository'

export class VehicleService {
  private repository: VehicleRepository

  constructor() {
    this.repository = new VehicleRepository()
  }

  async createVehicle(input: {
    drivingSchoolId: number
    registration: string
    brand: string
    model: string
    year: number
    instructorId?: number | null
  }) {
    const drivingSchoolId = Number(input.drivingSchoolId)
    const registration = input.registration?.trim()
    const brand = input.brand?.trim()
    const model = input.model?.trim()
    const year = Number(input.year)
    const instructorId = input.instructorId == null ? null : Number(input.instructorId)

    if (!Number.isInteger(drivingSchoolId) || drivingSchoolId <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid driving school ID'
      })
    }

    if (!registration || !brand || !model) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Registration, brand, and model are required'
      })
    }

    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Year must be a valid four-digit year'
      })
    }

    const school = await prisma.drivingSchool.findUnique({
      where: { id: drivingSchoolId },
      select: { id: true }
    })

    if (!school) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Driving school not found'
      })
    }

    if (await this.repository.findByRegistration(registration)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A vehicle with this registration already exists'
      })
    }

    if (instructorId !== null) {
      if (!Number.isInteger(instructorId) || instructorId <= 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Instructor ID must be a positive integer'
        })
      }

      const instructor = await prisma.user.findUnique({
        where: { id: instructorId },
        select: { id: true, instructorSchoolId: true }
      })

      if (!instructor) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Selected instructor user was not found'
        })
      }

      if (instructor.instructorSchoolId !== drivingSchoolId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Selected instructor does not belong to this driving school'
        })
      }
    }

    return this.repository.create({
      registration,
      brand,
      model,
      year,
      drivingSchoolId,
      instructorId
    })
  }

  async getSchoolVehicles(drivingSchoolId: number) {
    if (!Number.isInteger(drivingSchoolId) || drivingSchoolId <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid driving school ID'
      })
    }

    return this.repository.findByDrivingSchoolId(drivingSchoolId)
  }

  async updateVehicleInstructor(vehicleId: number, instructorId: number | null) {
    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid vehicle ID'
      })
    }

    const existingVehicle = await this.repository.findById(vehicleId)
    if (!existingVehicle) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Vehicle not found'
      })
    }

    if (instructorId !== null) {
      if (!Number.isInteger(instructorId) || instructorId <= 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Instructor ID must be a positive integer'
        })
      }

      const instructor = await prisma.user.findUnique({
        where: { id: instructorId },
        select: { id: true, instructorSchoolId: true }
      })

      if (!instructor) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Selected instructor user was not found'
        })
      }

      if (instructor.instructorSchoolId !== existingVehicle.drivingSchoolId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Selected instructor does not belong to this driving school'
        })
      }
    }

    return this.repository.updateInstructor(vehicleId, instructorId)
  }
}
