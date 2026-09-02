import prisma from '../../../utils/prisma'
import { requireSchoolManager } from '../../../utils/authorization'

/** POST /api/driving-schools/:id/categories adds a category to a school. */
export default defineEventHandler(async (event) => {
  const schoolId = Number(getRouterParam(event, 'id'))
  const body = await readBody(event) ?? {}
  const categoryId = Number(body.categoryId)

  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid driving school ID'
    })
  }

  await requireSchoolManager(event, schoolId)

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid category ID'
    })
  }

  const school = await prisma.drivingSchool.findUnique({
    where: { id: schoolId },
    select: { id: true }
  })

  if (!school) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Driving school not found'
    })
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true }
  })

  if (!category) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Category not found'
    })
  }

  const existingLink = await prisma.drivingSchool.findFirst({
    where: {
      id: schoolId,
      categories: {
        some: { id: categoryId }
      }
    },
    select: { id: true }
  })

  if (existingLink) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This category is already assigned to the driving school'
    })
  }

  const updatedSchool = await prisma.drivingSchool.update({
    where: { id: schoolId },
    data: {
      categories: {
        connect: { id: categoryId }
      }
    },
    include: {
      categories: true
    }
  })

  return {
    id: updatedSchool.id,
    categoryIds: updatedSchool.categories.map(category => category.id)
  }
})
