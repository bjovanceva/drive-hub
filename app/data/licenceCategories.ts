export type LicenceCategoryGroup = 'two-wheels' | 'cars' | 'goods' | 'passenger' | 'national'

export interface LicenceCategoryDefinition {
  code: string
  name: string
  shortName: string
  description: string
  group: LicenceCategoryGroup
  groupLabel: string
  price: number
  minimumAge: string
}

/**
 * North Macedonia's complete licence category set, including the national
 * categories F, G and T. Prices are shared Drive Hub programme estimates and
 * intentionally exclude medical, first-aid and examination fees.
 */
export const licenceCategories: LicenceCategoryDefinition[] = [
  {
    code: 'am',
    name: 'Moped & light quadricycle',
    shortName: 'Moped',
    description: 'Mopeds, light three-wheelers and quadricycles with a maximum design speed of 45 km/h.',
    group: 'two-wheels',
    groupLabel: 'Two wheels',
    price: 18000,
    minimumAge: '16 years'
  },
  {
    code: 'a1',
    name: 'Light motorcycle',
    shortName: 'Light motorcycle',
    description: 'Motorcycles up to 125 cm³ and 11 kW, plus lower-powered motor tricycles.',
    group: 'two-wheels',
    groupLabel: 'Two wheels',
    price: 22000,
    minimumAge: '16 years'
  },
  {
    code: 'a2',
    name: 'Medium motorcycle',
    shortName: 'Medium motorcycle',
    description: 'Motorcycles with power up to 35 kW and a power-to-weight ratio up to 0.2 kW/kg.',
    group: 'two-wheels',
    groupLabel: 'Two wheels',
    price: 25000,
    minimumAge: '18 years'
  },
  {
    code: 'a',
    name: 'Motorcycle',
    shortName: 'Motorcycle',
    description: 'Unrestricted motorcycles and motor tricycles above the lower category limits.',
    group: 'two-wheels',
    groupLabel: 'Two wheels',
    price: 28000,
    minimumAge: '24 years*'
  },
  {
    code: 'b',
    name: 'Passenger car',
    shortName: 'Passenger car',
    description: 'Cars and light vehicles up to 3,500 kg with no more than eight passenger seats.',
    group: 'cars',
    groupLabel: 'Cars & trailers',
    price: 33000,
    minimumAge: '18 years'
  },
  {
    code: 'be',
    name: 'Car with trailer',
    shortName: 'Car + trailer',
    description: 'A category B towing vehicle combined with a trailer above the standard B limit.',
    group: 'cars',
    groupLabel: 'Cars & trailers',
    price: 19000,
    minimumAge: '18 years'
  },
  {
    code: 'c1',
    name: 'Medium goods vehicle',
    shortName: 'Medium truck',
    description: 'Goods vehicles above 3,500 kg and up to 7,500 kg, with a light trailer if needed.',
    group: 'goods',
    groupLabel: 'Goods vehicles',
    price: 28500,
    minimumAge: '18 years'
  },
  {
    code: 'c1e',
    name: 'Medium goods combination',
    shortName: 'Medium truck + trailer',
    description: 'Category C1 combinations with a heavier trailer and a combined mass up to 12,000 kg.',
    group: 'goods',
    groupLabel: 'Goods vehicles',
    price: 22500,
    minimumAge: '18 years'
  },
  {
    code: 'c',
    name: 'Heavy goods vehicle',
    shortName: 'Heavy truck',
    description: 'Goods vehicles above 3,500 kg with no more than eight passenger seats.',
    group: 'goods',
    groupLabel: 'Goods vehicles',
    price: 38000,
    minimumAge: '21 years'
  },
  {
    code: 'ce',
    name: 'Heavy goods combination',
    shortName: 'Heavy truck + trailer',
    description: 'A category C towing vehicle combined with a trailer over 750 kg.',
    group: 'goods',
    groupLabel: 'Goods vehicles',
    price: 30000,
    minimumAge: '21 years'
  },
  {
    code: 'd1',
    name: 'Minibus',
    shortName: 'Minibus',
    description: 'Passenger vehicles with 9–16 passenger seats and a maximum length of eight metres.',
    group: 'passenger',
    groupLabel: 'Passenger transport',
    price: 34000,
    minimumAge: '21 years'
  },
  {
    code: 'd1e',
    name: 'Minibus with trailer',
    shortName: 'Minibus + trailer',
    description: 'A category D1 passenger vehicle combined with a trailer over 750 kg.',
    group: 'passenger',
    groupLabel: 'Passenger transport',
    price: 26000,
    minimumAge: '21 years'
  },
  {
    code: 'd',
    name: 'Bus',
    shortName: 'Bus',
    description: 'Passenger vehicles with more than eight passenger seats, plus a light trailer.',
    group: 'passenger',
    groupLabel: 'Passenger transport',
    price: 40000,
    minimumAge: '24 years'
  },
  {
    code: 'de',
    name: 'Bus with trailer',
    shortName: 'Bus + trailer',
    description: 'A category D passenger vehicle combined with a trailer over 750 kg.',
    group: 'passenger',
    groupLabel: 'Passenger transport',
    price: 32000,
    minimumAge: '24 years'
  },
  {
    code: 'f',
    name: 'Tractor',
    shortName: 'Tractor',
    description: 'National category for tractors, with or without a tractor trailer.',
    group: 'national',
    groupLabel: 'National categories',
    price: 16000,
    minimumAge: '17 years'
  },
  {
    code: 'g',
    name: 'Mobile machinery',
    shortName: 'Mobile machinery',
    description: 'National category for mobile working machines and motor cultivators.',
    group: 'national',
    groupLabel: 'National categories',
    price: 16000,
    minimumAge: '16 years'
  },
  {
    code: 't',
    name: 'Tram',
    shortName: 'Tram',
    description: 'National category for operating trams on an authorised urban rail network.',
    group: 'national',
    groupLabel: 'National categories',
    price: 20000,
    minimumAge: '21 years'
  }
]
