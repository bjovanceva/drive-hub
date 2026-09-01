import prisma from '../utils/prisma'

export interface DrivingSchoolFilters {
  location?: string
  category?: string
}

export interface CreateDrivingSchoolData {
  name: string
  email: string
  address: string
  description?: string
  phone: string
  city?: string
  managerId?: number
  createdAt: Date
  categoryIds?: number[]
}

const schoolRelations = {
  categories: true,
  _count: {
    select: {
      vehicles: true
    }
  }
} as const

/** Contains database-only driving-school queries used by the service layer. */
export class DrivingSchoolRepository {
  async findAll(filters: DrivingSchoolFilters = {}) {
    return prisma.drivingSchool.findMany({
      where: {
        OR: filters.location
          ? [
              { city: { equals: filters.location, mode: 'insensitive' } },
              { city: null, address: { contains: filters.location, mode: 'insensitive' } }
            ]
          : undefined,
        categories: filters.category
          ? { some: { code: { equals: filters.category, mode: 'insensitive' } } }
          : undefined
      },
      include: schoolRelations,
      orderBy: { name: 'asc' }
    })
  }

  async findById(id: number) {
    return prisma.drivingSchool.findUnique({
      where: { id },
      include: schoolRelations
    })
  }

  async findByEmail(email: string) {
    return prisma.drivingSchool.findUnique({
      where: { email }
    })
  }

  async countCategories(ids: number[]) {
    return prisma.category.count({
      where: { id: { in: ids } }
    })
  }

  async findCities() {
    return prisma.drivingSchool.findMany({
      where: { city: { not: null } },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' }
    })
  }

  async create(data: CreateDrivingSchoolData) {
    const { categoryIds, managerId, ...school } = data

    return prisma.drivingSchool.create({
      data: {
        ...school,
        manager: managerId
          ? { connect: { id: managerId } }
          : undefined,
        categories: categoryIds?.length
          ? { connect: categoryIds.map(id => ({ id })) }
          : undefined
      },
      include: schoolRelations
    })
  }

  async getUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managedSchool: {
          select: { id: true }
        }
      }
    })
  }

  async delete(id: number) {
    return prisma.drivingSchool.delete({
      where: { id }
    })
  }
}
