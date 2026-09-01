export interface SearchOptionDto {
  value: string
  label: string
}

/** Response returned by GET /api/search-options. */
export interface SchoolSearchOptionsDto {
  locations: SearchOptionDto[]
  categories: SearchOptionDto[]
}
