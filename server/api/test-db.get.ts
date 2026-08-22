import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  const schools = await prisma.drivingSchool.findMany()

  return schools
})