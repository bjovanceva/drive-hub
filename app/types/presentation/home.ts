export interface SelectOptionPresentationDto {
  value: string
  label: string
}

export interface SchoolSearchPresentationDto {
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
  actionLabel?: string
  actionTo?: string
}

export interface HomePagePresentationDto {
  hero: {
    eyebrow: string
    titleLines: string[]
    description: string
    proof: string
  }
  network: SectionHeadingPresentationDto & {
    stats: StatTilePresentationDto[]
  }
  featuredSchools: SectionHeadingPresentationDto
  licenceCategories: SectionHeadingPresentationDto
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
