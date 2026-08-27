export interface SchoolDirectoryItemDto {
  id: string
  name: string
  city: string
  municipality: string
  categories: string[]
  rating: number
  reviewCount: number
  priceFrom: number
  nextStart: string
  languages: string[]
  vehicles: string
  verified: boolean
  availability: 'open' | 'limited'
}

export interface SchoolDirectoryResponseDto {
  items: SchoolDirectoryItemDto[]
  total: number
}
