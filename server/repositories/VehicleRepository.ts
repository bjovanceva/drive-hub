import prisma from '../utils/prisma'

export class VehicleRepository {
  async findByRegistration(registration: string) {
    return prisma.vehicle.findUnique({
      where: { registration }
    })
  }

  async create(data: {
    registration: string
    brand: string
    model: string
    year: number
    drivingSchoolId: number
    instructorId?: number | null
  }) {
    return prisma.vehicle.create({
      data: {
        registration: data.registration,
        brand: data.brand,
        model: data.model,
        year: data.year,
        drivingSchoolId: data.drivingSchoolId,
        instructorId: data.instructorId ?? null
      }
    })
  }

  async findByDrivingSchoolId(drivingSchoolId: number) {
    return prisma.vehicle.findMany({
      where: { drivingSchoolId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { registration: 'asc' }
    })
  }

  async findById(id: number) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        drivingSchool: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  async updateInstructor(id: number, instructorId: number | null) {
    return prisma.vehicle.update({
      where: { id },
      data: { instructorId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  }
}
