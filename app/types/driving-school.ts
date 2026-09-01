/** Category data embedded in a driving-school API response. */
export interface DrivingSchoolCategoryDto {
  id: number
  code: string | null
  name: string
  price: string | number
  theoryLessons: number
  practicalLessons: number
  minimumAge: number
}

/**
 * JSON-safe shape returned by /api/driving-schools.
 * Prisma dates and decimals are represented as their serialized values.
 */
export interface DrivingSchoolDto {
  id: number
  name: string
  email: string
  description: string | null
  phone: string
  address: string
  city: string | null
  createdAt: string
  categories: DrivingSchoolCategoryDto[]
  _count: {
    vehicles: number
  }
}

/** Payload accepted when creating a driving school. */
export interface CreateDrivingSchoolInput {
  name: string
  email: string
  address: string
  city?: string
  description?: string
  phone: string
  createdAt?: string
  categoryIds?: number[]
}

export interface DeleteDrivingSchoolResponseDto {
  id: number
}
