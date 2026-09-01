import { CategoryRepository } from '../repositories/CategoryRepository'
import { DrivingSchoolRepository } from '../repositories/DrivingSchoolRepository'

/** Builds stable form options exclusively from persisted categories and schools. */
export class SearchOptionsService {
  private categories = new CategoryRepository()
  private schools = new DrivingSchoolRepository()

  async getSchoolSearchOptions() {
    const [categories, cityRows] = await Promise.all([
      this.categories.findAllForSearch(),
      this.schools.findCities()
    ])

    const locations = new Map<string, string>()
    for (const row of cityRows) {
      if (!row.city) continue
      const label = row.city.trim()
      const value = label.toLocaleLowerCase('mk')
      if (label && !locations.has(value)) locations.set(value, label)
    }

    return {
      locations: [...locations].map(([value, label]) => ({ value, label })),
      categories: categories.flatMap(category => category.code
        ? [{
            value: category.code.toLowerCase(),
            label: `${category.code.toUpperCase()} — ${category.name}`
          }]
        : [])
    }
  }
}
