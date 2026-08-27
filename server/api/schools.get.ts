import type { SchoolDirectoryItemDto, SchoolDirectoryResponseDto } from '~/types/presentation/schools'

const schools: SchoolDirectoryItemDto[] = [
  { id: 'apex-drive', name: 'Apex Drive', city: 'skopje', municipality: 'Karpoš', categories: ['a', 'b'], rating: 4.9, reviewCount: 184, priceFrom: 28900, nextStart: '02 Sep', languages: ['MK', 'EN'], vehicles: '12 training vehicles', verified: true, availability: 'open' },
  { id: 'vector-auto', name: 'Vector Auto', city: 'skopje', municipality: 'Aerodrom', categories: ['a', 'b'], rating: 4.8, reviewCount: 126, priceFrom: 31500, nextStart: '05 Sep', languages: ['MK', 'AL', 'EN'], vehicles: '9 training vehicles', verified: true, availability: 'limited' },
  { id: 'urban-motor', name: 'Urban Motor', city: 'skopje', municipality: 'Centar', categories: ['b'], rating: 4.7, reviewCount: 98, priceFrom: 27400, nextStart: '09 Sep', languages: ['MK', 'EN'], vehicles: '8 training vehicles', verified: true, availability: 'open' },
  { id: 'transit-pro', name: 'Transit Pro', city: 'skopje', municipality: 'Gazi Baba', categories: ['b', 'c'], rating: 4.6, reviewCount: 74, priceFrom: 33600, nextStart: '12 Sep', languages: ['MK', 'AL'], vehicles: '6 cars · 4 trucks', verified: true, availability: 'open' },
  { id: 'pole-position', name: 'Pole Position', city: 'tetovo', municipality: 'Centre', categories: ['b', 'c'], rating: 4.9, reviewCount: 152, priceFrom: 27400, nextStart: '03 Sep', languages: ['MK', 'AL'], vehicles: '10 training vehicles', verified: true, availability: 'open' },
  { id: 'sharr-moto', name: 'Sharr Moto', city: 'tetovo', municipality: 'Drenovec', categories: ['a', 'b'], rating: 4.7, reviewCount: 89, priceFrom: 26800, nextStart: '10 Sep', languages: ['AL', 'MK', 'EN'], vehicles: '7 cars · 5 motorcycles', verified: true, availability: 'limited' },
  { id: 'pelagonija-drive', name: 'Pelagonija Drive', city: 'bitola', municipality: 'Centre', categories: ['a', 'b'], rating: 4.8, reviewCount: 117, priceFrom: 25900, nextStart: '04 Sep', languages: ['MK', 'EN'], vehicles: '11 training vehicles', verified: true, availability: 'open' },
  { id: 'heraclea-auto', name: 'Heraclea Auto', city: 'bitola', municipality: 'Nova Bitola', categories: ['b', 'c'], rating: 4.6, reviewCount: 63, priceFrom: 24700, nextStart: '14 Sep', languages: ['MK'], vehicles: '8 training vehicles', verified: true, availability: 'open' },
  { id: 'north-line', name: 'North Line', city: 'kumanovo', municipality: 'Centre', categories: ['b', 'c'], rating: 4.8, reviewCount: 104, priceFrom: 26300, nextStart: '06 Sep', languages: ['MK', 'SR'], vehicles: '9 training vehicles', verified: true, availability: 'open' },
  { id: 'start-plus', name: 'Start Plus', city: 'kumanovo', municipality: 'Bedinje', categories: ['a', 'b'], rating: 4.5, reviewCount: 58, priceFrom: 24900, nextStart: '16 Sep', languages: ['MK', 'AL'], vehicles: '6 training vehicles', verified: true, availability: 'limited' }
]

function queryValue(value: unknown) {
  return typeof value === 'string' && value !== 'all' ? value.toLowerCase() : undefined
}

export default defineEventHandler((event): SchoolDirectoryResponseDto => {
  const query = getQuery(event)
  const location = queryValue(query.location)
  const category = queryValue(query.category)
  const items = schools.filter(school => (
    (!location || school.city === location)
    && (!category || school.categories.includes(category))
  ))

  return { items, total: items.length }
})
