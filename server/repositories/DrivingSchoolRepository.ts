import prisma from '../utils/prisma'

export class DrivingSchoolRepository {
  async findAll() {
    return prisma.drivingSchool.findMany()
  }

  async findById(id: number) {
    return prisma.drivingSchool.findUnique({
      where: { id }
    })
  }

  async create(data: {
    name: string
    email: string
    address: string
    description?: string
    phone: string
    createdAt: Date
  }) {
    return prisma.drivingSchool.create({
      data
    })
  }

  async delete(id: number) {
    return prisma.drivingSchool.delete({
      where: { id }
    })
  }
}