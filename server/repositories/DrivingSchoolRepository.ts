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

  async create(data: {
    name: string
    email: string
    location: string
    address: string
    description?: string
    phone: string
    createdAt: Date
  }) {
    return prisma.drivingSchool.create({
      data: {
        ...school,
        categories: categoryIds?.length
          ? { connect: categoryIds.map(id => ({ id })) }
          : undefined
      },
      include: schoolRelations
    })
  }

  async delete(id: number) {
    return prisma.drivingSchool.delete({
      where: { id }
    })
  }

  async findLocations() {
    return prisma.drivingSchool.findMany({
      select: {
        location: true
      },
      distinct: ['location'],
      orderBy: {
        location: 'asc'
      }
    })
  }
  
  async searchByLocationAndCategory(location: string, category: string) {
    // TO DO
  }
}
