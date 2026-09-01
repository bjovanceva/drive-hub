import prisma from '../utils/prisma'

/** Read-only category queries used to construct backend-driven search options. */
export class CategoryRepository {
  async findAllForSearch() {
    return prisma.category.findMany({
      where: { code: { not: null } },
      select: {
        code: true,
        name: true
      },
      orderBy: { id: 'asc' }
    })
  }
}
