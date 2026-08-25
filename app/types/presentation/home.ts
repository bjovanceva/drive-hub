export interface SelectOptionPresentationDto {
  value: string
  label: string
}

export interface HomeSearchPresentationDto {
  locations: SelectOptionPresentationDto[]
  categories: SelectOptionPresentationDto[]
  defaultLocation: string
  defaultCategory: string
  submitLabel: string
}

export interface StatTilePresentationDto {
  id: string
  value: string
  label: string
  meta: string
}

export interface SchoolCardPresentationDto {
  id: string
  schoolName: string
  location: string
  licenceType: string
  price: string
  verified: boolean
  to: string
}

export interface CategoryTilePresentationDto {
  id: string
  code: string
  label: string
  meta: string
  to: string
}

export interface JourneyStepPresentationDto {
  id: string
  number: string
  tag: string
  title: string
  description: string
  status?: 'default' | 'ready'
}

export interface SectionHeadingPresentationDto {
  eyebrow: string
  title: string
  description?: string
}

export interface HomePagePresentationDto {
  hero: {
    eyebrow: string
    titleLines: string[]
    description: string
    proof: string
    search: HomeSearchPresentationDto
  }
  network: SectionHeadingPresentationDto & {
    stats: StatTilePresentationDto[]
  }
  featuredSchools: SectionHeadingPresentationDto & {
    actionLabel: string
    actionTo: string
    schools: SchoolCardPresentationDto[]
  }
  licenceCategories: SectionHeadingPresentationDto & {
    categories: CategoryTilePresentationDto[]
  }
  journey: SectionHeadingPresentationDto & {
    steps: JourneyStepPresentationDto[]
  }
  finalCta: {
    eyebrow: string
    title: string
    description: string
    actionLabel: string
    actionTo: string
  }
}
