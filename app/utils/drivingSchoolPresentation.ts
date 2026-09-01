import type { DrivingSchoolDto } from '~/types/driving-school'
import type { SchoolDirectoryItemDto } from '~/types/presentation/schools'

function cityValue(school: DrivingSchoolDto) {
  const city = school.city?.trim() || school.address.split(',').at(-1)?.trim()
  return city || 'North Macedonia'
}

function numericPrice(price: string | number) {
  const value = typeof price === 'number' ? price : Number.parseFloat(price)
  return Number.isFinite(value) ? value : 0
}

/**
 * Adapts persisted school data to the richer directory-card contract.
 *
 * Rating, availability, languages and intake dates are not in Prisma yet, so
 * neutral display defaults live in this single transition layer instead of in
 * page components. Remove those defaults when the schema gains the fields.
 */
export function toSchoolDirectoryItem(school: DrivingSchoolDto): SchoolDirectoryItemDto {
  const prices = school.categories.map(category => numericPrice(category.price)).filter(price => price > 0)

  return {
    id: String(school.id),
    name: school.name,
    city: cityValue(school),
    municipality: school.address,
    categories: school.categories.flatMap(category => category.code ? [category.code.toLowerCase()] : []),
    rating: 0,
    reviewCount: 0,
    priceFrom: prices.length ? Math.min(...prices) : 0,
    nextStart: 'Contact school',
    languages: ['MK'],
    vehicles: `${school._count.vehicles} training ${school._count.vehicles === 1 ? 'vehicle' : 'vehicles'}`,
    verified: true,
    availability: 'open'
  }
}
