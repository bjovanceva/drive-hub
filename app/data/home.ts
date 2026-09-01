import type { HomePagePresentationDto } from '~/types/presentation/home'

/**
 * Static editorial copy for the home page. Search options and school records
 * deliberately live outside this object and come from backend composables.
 */
export const defaultHomePageData: HomePagePresentationDto = {
  hero: {
    eyebrow: 'The fast line to your licence',
    titleLines: ['Find your line.', 'Own the road.'],
    description: 'Compare verified driving schools, instructors, vehicles, and licence programmes—all in one focused hub built for your next move.',
    proof: '48+ verified schools · Live availability',
    search: {
      locations: [
        { value: 'skopje', label: 'Skopje' },
        { value: 'tetovo', label: 'Tetovo' },
        { value: 'bitola', label: 'Bitola' },
        { value: 'kumanovo', label: 'Kumanovo' }
      ],
      categories: [
        { value: 'a1', label: 'A1 - Light motorcycle' },
        { value: 'a', label: 'A — Motorcycle' },
        { value: 'b', label: 'B — Passenger car' },
        { value: 'be', label: 'BE - Category B + heavier trailer' },
        { value: 'c1', label: 'C1 — Medium vehicle' },
        { value: 'c1e', label: 'C1E — C1 + trailer' },
        { value: 'c', label: 'C — Heavy vehicle' },
        { value: 'ce', label: 'CE — C + trailer' },
        { value: 'd1', label: 'Smaller bus/minibus' },
        { value: 'd1e', label: 'D1E — D1 + trailer' },
        { value: 'd', label: 'D — Bus' },
        { value: 'de', label: 'DE — D + trailer' },
        { value: 'e', label: 'E — Articulated vehicle' },
        { value: 'eb', label: 'EB — E + trailer' },
        { value: 'f', label: 'F — Tractor and tractor trailer' },
        { value: 'g', label: 'G — Mobile/working machine' },
      ],
      defaultLocation: 'skopje',
      defaultCategory: 'b',
      submitLabel: 'Search schools →'
    }
  },
  network: {
    eyebrow: 'Network / Live proof',
    title: 'The grid is active.',
    description: 'Verified schools, real learner activity, and trusted reviews—tracked across the Drive Hub network.',
    stats: [
      { id: 'verified-schools', value: '48+', label: 'Verified schools', meta: 'Skopje + 7 cities' },
      { id: 'active-learners', value: '1.2K', label: 'Active learners', meta: 'This season' },
      { id: 'average-rating', value: '4.9', label: 'Average rating', meta: 'Verified reviews' }
    ]
  },
  featuredSchools: {
    eyebrow: 'Marketplace / Featured',
    title: 'Choose your pit crew.',
    actionLabel: 'View all schools →',
    actionTo: '/schools'
  },
  licenceCategories: {
    eyebrow: 'Licences / Select your class',
    title: 'Pick your machine.',
    description: 'From first rides to heavy vehicles, compare programmes by category and move straight to the right schools.',
    actionLabel: 'View all categories →',
    actionTo: '/categories'
  },
  journey: {
    eyebrow: 'Process / Three clean moves',
    title: 'From search to start.',
    description: 'No scattered calls, vague pricing, or dead ends. Compare, apply, and track your progress in one place.',
    steps: [
      {
        id: 'search',
        number: '01',
        tag: 'Search',
        title: 'Set your line',
        description: 'Choose your city and licence category. Drive Hub filters the network to verified, relevant schools.'
      },
      {
        id: 'compare',
        number: '02',
        tag: 'Compare',
        title: 'Check the grid',
        description: 'Review programmes, vehicles, instructors, pricing, and learner feedback side by side.'
      },
      {
        id: 'apply',
        number: '03',
        tag: 'Apply',
        title: 'Take the start',
        description: 'Send one focused application, follow status updates, and keep every next step visible.',
        status: 'ready'
      }
    ]
  },
  finalCta: {
    eyebrow: 'Ready / Green light',
    title: 'Your first move starts here.',
    description: 'Choose a verified school, compare the programme, and put your application on the grid today.',
    actionLabel: 'Start your application →',
    actionTo: '#apply'
  }
}
