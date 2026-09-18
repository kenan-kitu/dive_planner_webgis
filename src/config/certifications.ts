export type CertificationAgency = 'PADI' | 'SSI' | 'CMAS'

export type CertificationAgeGroup = '10-11' | '12-14' | '15+'

export type DepthRuleType =
  | 'fixed'
  | 'inherited'
  | 'conditional'
  | 'gasDependent'
  | 'trainingOnly'
  | 'notApplicable'

export type CertificationCategory =
  | 'entry'
  | 'continuing'
  | 'specialty'
  | 'recognition'
  | 'professional'
  | 'technical'

export interface CertificationLevel {
  id: string
  agency: CertificationAgency
  name: string
  shortName?: string
  category: CertificationCategory
  depthRuleType: DepthRuleType
  maxDepthM?: number
  minimumAge?: number
  maximumAge?: number
  isJunior?: boolean
  ageDepthLimits?: Partial<Record<CertificationAgeGroup, number>>
  prerequisiteIds?: string[]
  allowedPreviousQualificationIds?: string[]
  allowedAdditionalQualificationIds?: string[]
  levelOrder?: number
  affectsDepth?: boolean
  hiddenFromMainSelector?: boolean
  professionalOnly?: boolean
  descriptionKey: string
  conditionsKey?: string
  officialSourceUrl?: string
}

export const AGENCIES: CertificationAgency[] = ['PADI', 'SSI', 'CMAS']

const PADI_DEPTH_SOURCE =
  'https://blog.padi.com/how-deep-can-open-water-vs-advanced-divers-go/'
const PADI_SCUBA_SOURCE =
  'https://blog.padi.com/whats-the-difference-between-scuba-diver-and-open-water-diver/'
const SSI_SCUBA_SOURCE =
  'https://www.divessi.com/en/get-certified/scuba-diving/scuba-diver'
const SSI_OPEN_WATER_SOURCE =
  'https://www.divessi.com/en/get-certified/scuba-diving/open-water-diver'
const SSI_ADVANCED_SOURCE =
  'https://www.divessi.com/en/advanced-training/scuba-diving/advanced-open-water-diver'
const SSI_DEEP_SOURCE =
  'https://www.divessi.com/en/advanced-training/scuba-diving/deep-diving'
const SSI_ADVANCED_TRAINING_SOURCE =
  'https://www.divessi.com/en/advanced-training'
const CMAS_ONE_STAR_SOURCE =
  'https://archives.cmas.org/document?fileId=5387&language=1'
const CMAS_TWO_STAR_SOURCE =
  'https://archives.cmas.org/document?fileId=5390&language=1'
const CMAS_THREE_STAR_SOURCE =
  'https://archives.cmas.org/document?fileId=5392&language=1'

export const CERTIFICATION_CATALOG: CertificationLevel[] = [
  {
    id: 'padi-scuba-diver',
    agency: 'PADI',
    name: 'Scuba Diver',
    category: 'entry',
    depthRuleType: 'fixed',
    maxDepthM: 12,
    affectsDepth: true,
    minimumAge: 10,
    descriptionKey: 'padi-scuba-diver',
    conditionsKey: 'padi-scuba-diver',
    officialSourceUrl: PADI_SCUBA_SOURCE,
  },
  {
    id: 'padi-open-water',
    agency: 'PADI',
    name: 'Open Water Diver',
    shortName: 'OWD',
    category: 'entry',
    depthRuleType: 'fixed',
    maxDepthM: 18,
    affectsDepth: true,
    minimumAge: 15,
    descriptionKey: 'padi-open-water',
    officialSourceUrl: PADI_DEPTH_SOURCE,
  },
  {
    id: 'padi-junior-open-water',
    agency: 'PADI',
    name: 'Junior Open Water Diver',
    category: 'entry',
    depthRuleType: 'conditional',
    minimumAge: 10,
    isJunior: true,
    ageDepthLimits: { '10-11': 12, '12-14': 18 },
    affectsDepth: true,
    descriptionKey: 'padi-junior-open-water',
    conditionsKey: 'junior-age-dependent',
    officialSourceUrl: 'https://www.padi.com/help/scuba-certification-faq',
  },
  {
    id: 'padi-advanced-open-water',
    agency: 'PADI',
    name: 'Advanced Open Water Diver',
    shortName: 'AOWD',
    category: 'continuing',
    depthRuleType: 'fixed',
    maxDepthM: 30,
    allowedAdditionalQualificationIds: ['padi-deep-diver'],
    affectsDepth: true,
    minimumAge: 15,
    descriptionKey: 'padi-advanced-open-water',
    officialSourceUrl: PADI_DEPTH_SOURCE,
  },
  {
    id: 'padi-junior-advanced-open-water',
    agency: 'PADI',
    name: 'Junior Advanced Open Water Diver',
    category: 'continuing',
    depthRuleType: 'conditional',
    minimumAge: 12,
    isJunior: true,
    ageDepthLimits: { '12-14': 21 },
    affectsDepth: true,
    descriptionKey: 'padi-junior-advanced-open-water',
    conditionsKey: 'junior-age-dependent',
    officialSourceUrl:
      'https://blog.padi.com/padi-advanced-open-water-diver-faqs/',
  },
  {
    id: 'padi-deep-diver',
    agency: 'PADI',
    name: 'Deep Diver',
    category: 'specialty',
    depthRuleType: 'fixed',
    maxDepthM: 40,
    prerequisiteIds: [
      'padi-advanced-open-water',
      'padi-rescue-diver',
      'padi-divemaster',
    ],
    affectsDepth: true,
    hiddenFromMainSelector: true,
    minimumAge: 15,
    descriptionKey: 'padi-deep-diver',
    officialSourceUrl: PADI_DEPTH_SOURCE,
  },
  {
    id: 'padi-rescue-diver',
    agency: 'PADI',
    name: 'Rescue Diver',
    category: 'continuing',
    depthRuleType: 'inherited',
    allowedPreviousQualificationIds: [
      'padi-advanced-open-water',
      'padi-junior-advanced-open-water',
    ],
    allowedAdditionalQualificationIds: ['padi-deep-diver'],
    descriptionKey: 'padi-rescue-diver',
    conditionsKey: 'inherits-depth',
    officialSourceUrl: 'https://www.padi.com/courses/rescue-diver',
  },
  {
    id: 'padi-master-scuba-diver',
    agency: 'PADI',
    name: 'Master Scuba Diver',
    shortName: 'MSD',
    category: 'recognition',
    depthRuleType: 'inherited',
    allowedPreviousQualificationIds: [
      'padi-open-water',
      'padi-advanced-open-water',
    ],
    allowedAdditionalQualificationIds: ['padi-deep-diver'],
    professionalOnly: true,
    descriptionKey: 'padi-master-scuba-diver',
    conditionsKey: 'recognition-inherits-depth',
    officialSourceUrl: 'https://www.padi.com/courses/master-scuba-diver',
  },
  {
    id: 'padi-divemaster',
    agency: 'PADI',
    name: 'Divemaster',
    category: 'professional',
    depthRuleType: 'inherited',
    allowedPreviousQualificationIds: [
      'padi-open-water',
      'padi-advanced-open-water',
    ],
    allowedAdditionalQualificationIds: ['padi-deep-diver'],
    professionalOnly: true,
    descriptionKey: 'padi-divemaster',
    conditionsKey: 'professional-inherits-depth',
    officialSourceUrl: 'https://www.padi.com/courses/divemaster',
  },

  {
    id: 'ssi-scuba-diver',
    agency: 'SSI',
    name: 'Scuba Diver',
    category: 'entry',
    depthRuleType: 'fixed',
    maxDepthM: 12,
    affectsDepth: true,
    minimumAge: 10,
    descriptionKey: 'ssi-scuba-diver',
    conditionsKey: 'ssi-scuba-diver',
    officialSourceUrl: SSI_SCUBA_SOURCE,
  },
  {
    id: 'ssi-junior-open-water',
    agency: 'SSI',
    name: 'Junior Open Water Diver',
    category: 'entry',
    depthRuleType: 'conditional',
    minimumAge: 10,
    isJunior: true,
    ageDepthLimits: { '10-11': 12, '12-14': 18 },
    affectsDepth: true,
    descriptionKey: 'ssi-junior-open-water',
    conditionsKey: 'junior-age-dependent',
    officialSourceUrl: SSI_OPEN_WATER_SOURCE,
  },
  {
    id: 'ssi-junior-advanced-adventurer',
    agency: 'SSI',
    name: 'Junior Advanced Adventurer',
    category: 'continuing',
    depthRuleType: 'conditional',
    maxDepthM: 21,
    minimumAge: 12,
    maximumAge: 14,
    isJunior: true,
    ageDepthLimits: { '12-14': 21 },
    affectsDepth: true,
    descriptionKey: 'ssi-junior-advanced-adventurer',
    conditionsKey: 'ssi-junior-advanced-adventurer',
    officialSourceUrl: SSI_ADVANCED_TRAINING_SOURCE,
  },
  {
    id: 'ssi-open-water',
    agency: 'SSI',
    name: 'Open Water Diver',
    shortName: 'OWD',
    category: 'entry',
    depthRuleType: 'fixed',
    maxDepthM: 18,
    affectsDepth: true,
    minimumAge: 15,
    descriptionKey: 'ssi-open-water',
    officialSourceUrl: SSI_OPEN_WATER_SOURCE,
  },
  {
    id: 'ssi-advanced-adventurer',
    agency: 'SSI',
    name: 'Advanced Adventurer',
    category: 'continuing',
    depthRuleType: 'conditional',
    maxDepthM: 30,
    allowedAdditionalQualificationIds: ['ssi-deep-diving'],
    affectsDepth: true,
    descriptionKey: 'ssi-advanced-adventurer',
    conditionsKey: 'ssi-advanced-adventurer',
    officialSourceUrl: SSI_ADVANCED_TRAINING_SOURCE,
  },
  {
    id: 'ssi-advanced-open-water',
    agency: 'SSI',
    name: 'Advanced Open Water Diver',
    shortName: 'AOWD',
    category: 'continuing',
    depthRuleType: 'inherited',
    allowedPreviousQualificationIds: [
      'ssi-open-water',
      'ssi-advanced-adventurer',
    ],
    allowedAdditionalQualificationIds: ['ssi-deep-diving'],
    minimumAge: 12,
    descriptionKey: 'ssi-advanced-open-water',
    conditionsKey: 'inherits-depth',
    officialSourceUrl: SSI_ADVANCED_SOURCE,
  },
  {
    id: 'ssi-deep-diving',
    agency: 'SSI',
    name: 'Deep Diving',
    category: 'specialty',
    depthRuleType: 'fixed',
    maxDepthM: 40,
    prerequisiteIds: [
      'ssi-advanced-adventurer',
      'ssi-advanced-open-water',
      'ssi-diver-stress-rescue',
      'ssi-master-diver',
      'ssi-dive-guide',
      'ssi-divemaster',
    ],
    affectsDepth: true,
    hiddenFromMainSelector: true,
    minimumAge: 15,
    descriptionKey: 'ssi-deep-diving',
    officialSourceUrl: SSI_DEEP_SOURCE,
  },
  {
    id: 'ssi-decompression-diving',
    agency: 'SSI',
    name: 'Decompression Diving',
    category: 'specialty',
    depthRuleType: 'trainingOnly',
    maxDepthM: 40,
    descriptionKey: 'ssi-decompression-diving',
    conditionsKey: 'ssi-decompression-diving',
    officialSourceUrl:
      'https://www.divessi.com/en/advanced-training/scuba-diving/decompression-diving',
  },
  {
    id: 'ssi-enriched-air-nitrox',
    agency: 'SSI',
    name: 'Enriched Air Nitrox',
    category: 'specialty',
    depthRuleType: 'gasDependent',
    descriptionKey: 'ssi-enriched-air-nitrox',
    conditionsKey: 'gas-dependent',
    officialSourceUrl:
      'https://www.divessi.com/en/advanced-training/scuba-diving/enriched-air-nitrox-40',
  },
  {
    id: 'ssi-diver-stress-rescue',
    agency: 'SSI',
    name: 'Diver Stress & Rescue',
    category: 'continuing',
    depthRuleType: 'inherited',
    allowedPreviousQualificationIds: [
      'ssi-open-water',
      'ssi-advanced-adventurer',
    ],
    allowedAdditionalQualificationIds: ['ssi-deep-diving'],
    descriptionKey: 'ssi-diver-stress-rescue',
    conditionsKey: 'inherits-depth',
    officialSourceUrl: SSI_ADVANCED_TRAINING_SOURCE,
  },
  ...[
    ['ssi-specialty-diver', 'Specialty Diver'],
    ['ssi-advanced-specialty-diver', 'Advanced Specialty Diver'],
    ['ssi-master-diver', 'Master Diver'],
    ['ssi-century-diver', 'Century Diver'],
    ['ssi-elite-diver', 'Elite Diver'],
    ['ssi-gold-diver', 'Gold Diver'],
    ['ssi-platinum-diver', 'Platinum Diver'],
    ['ssi-diamond-diver', 'Diamond Diver'],
    ['ssi-platinum-pro-diver', 'Platinum Pro Diver'],
  ].map(([id, name]) => ({
    id,
    agency: 'SSI' as const,
    name,
    category: 'recognition' as const,
    depthRuleType: 'inherited' as const,
    allowedPreviousQualificationIds:
      id === 'ssi-master-diver'
        ? ['ssi-open-water', 'ssi-advanced-adventurer']
        : undefined,
    allowedAdditionalQualificationIds:
      id === 'ssi-master-diver' ? ['ssi-deep-diving'] : undefined,
    hiddenFromMainSelector: id !== 'ssi-master-diver',
    descriptionKey: id,
    conditionsKey: 'recognition-inherits-depth',
    officialSourceUrl: SSI_ADVANCED_TRAINING_SOURCE,
  })),
  {
    id: 'ssi-marine-guide',
    agency: 'SSI',
    name: 'Marine Guide',
    category: 'professional',
    depthRuleType: 'inherited',
    allowedPreviousQualificationIds: [
      'ssi-open-water',
      'ssi-advanced-adventurer',
    ],
    allowedAdditionalQualificationIds: ['ssi-deep-diving'],
    professionalOnly: true,
    descriptionKey: 'ssi-marine-guide',
    conditionsKey: 'professional-inherits-depth',
    officialSourceUrl: SSI_ADVANCED_TRAINING_SOURCE,
  },
  {
    id: 'ssi-dive-guide',
    agency: 'SSI',
    name: 'Dive Guide',
    category: 'professional',
    depthRuleType: 'inherited',
    allowedPreviousQualificationIds: [
      'ssi-open-water',
      'ssi-advanced-adventurer',
    ],
    allowedAdditionalQualificationIds: ['ssi-deep-diving'],
    professionalOnly: true,
    descriptionKey: 'ssi-dive-guide',
    conditionsKey: 'professional-inherits-depth',
    officialSourceUrl: SSI_ADVANCED_TRAINING_SOURCE,
  },
  {
    id: 'ssi-divemaster',
    agency: 'SSI',
    name: 'Divemaster',
    category: 'professional',
    depthRuleType: 'inherited',
    allowedPreviousQualificationIds: [
      'ssi-open-water',
      'ssi-advanced-adventurer',
    ],
    allowedAdditionalQualificationIds: ['ssi-deep-diving'],
    professionalOnly: true,
    descriptionKey: 'ssi-divemaster',
    conditionsKey: 'professional-inherits-depth',
    officialSourceUrl: SSI_ADVANCED_TRAINING_SOURCE,
  },

  {
    id: 'cmas-one-star',
    agency: 'CMAS',
    name: 'One Star Diver',
    shortName: 'CMAS *',
    category: 'entry',
    depthRuleType: 'fixed',
    maxDepthM: 20,
    affectsDepth: true,
    descriptionKey: 'cmas-one-star',
    conditionsKey: 'cmas-local-rules',
    officialSourceUrl: CMAS_ONE_STAR_SOURCE,
  },
  {
    id: 'cmas-two-star',
    agency: 'CMAS',
    name: 'Two Star Diver',
    shortName: 'CMAS **',
    category: 'continuing',
    depthRuleType: 'fixed',
    maxDepthM: 30,
    allowedAdditionalQualificationIds: ['cmas-two-star-advanced'],
    affectsDepth: true,
    descriptionKey: 'cmas-two-star',
    conditionsKey: 'cmas-local-rules',
    officialSourceUrl: CMAS_TWO_STAR_SOURCE,
  },
  {
    id: 'cmas-two-star-advanced',
    agency: 'CMAS',
    name: 'Two Star + Documented Advanced Training',
    shortName: 'CMAS ** +',
    category: 'specialty',
    depthRuleType: 'conditional',
    maxDepthM: 40,
    prerequisiteIds: ['cmas-two-star'],
    affectsDepth: true,
    hiddenFromMainSelector: true,
    descriptionKey: 'cmas-two-star-advanced',
    conditionsKey: 'cmas-two-star-advanced',
    officialSourceUrl: CMAS_TWO_STAR_SOURCE,
  },
  {
    id: 'cmas-three-star',
    agency: 'CMAS',
    name: 'Three Star Diver',
    shortName: 'CMAS ***',
    category: 'professional',
    depthRuleType: 'fixed',
    maxDepthM: 40,
    affectsDepth: true,
    descriptionKey: 'cmas-three-star',
    conditionsKey: 'cmas-local-rules',
    officialSourceUrl: CMAS_THREE_STAR_SOURCE,
  },
  {
    id: 'cmas-four-star',
    agency: 'CMAS',
    name: 'Four Star Diver',
    shortName: 'CMAS ****',
    category: 'recognition',
    depthRuleType: 'notApplicable',
    descriptionKey: 'cmas-four-star',
    conditionsKey: 'no-current-fixed-rule',
    officialSourceUrl: 'https://www.cmas.org/',
  },
  {
    id: 'cmas-divemaster',
    agency: 'CMAS',
    name: 'Divemaster',
    category: 'professional',
    depthRuleType: 'inherited',
    descriptionKey: 'cmas-divemaster',
    conditionsKey: 'professional-inherits-depth',
    officialSourceUrl: CMAS_THREE_STAR_SOURCE,
  },
  {
    id: 'cmas-advanced-skills',
    agency: 'CMAS',
    name: 'Advanced Skills Diver',
    category: 'continuing',
    depthRuleType: 'trainingOnly',
    descriptionKey: 'cmas-advanced-skills',
    conditionsKey: 'no-current-fixed-rule',
    officialSourceUrl: 'https://www.cmas.org/',
  },
  {
    id: 'cmas-nitrox',
    agency: 'CMAS',
    name: 'Nitrox Diver',
    category: 'specialty',
    depthRuleType: 'gasDependent',
    descriptionKey: 'cmas-nitrox',
    conditionsKey: 'gas-dependent',
    officialSourceUrl:
      'https://archives.cmas.org/document?fileId=2144&language=1',
  },
]

export const DEFAULT_CERTIFICATION_BY_AGENCY: Record<
  CertificationAgency,
  string
> = {
  PADI: 'padi-open-water',
  SSI: 'ssi-open-water',
  CMAS: 'cmas-one-star',
}

export const PRIMARY_CERTIFICATION_IDS: Record<
  CertificationAgency,
  readonly string[]
> = {
  PADI: [
    'padi-scuba-diver',
    'padi-junior-open-water',
    'padi-open-water',
    'padi-junior-advanced-open-water',
    'padi-advanced-open-water',
    'padi-rescue-diver',
    'padi-divemaster',
  ],
  SSI: [
    'ssi-scuba-diver',
    'ssi-junior-open-water',
    'ssi-open-water',
    'ssi-junior-advanced-adventurer',
    'ssi-advanced-adventurer',
    'ssi-advanced-open-water',
    'ssi-diver-stress-rescue',
    'ssi-master-diver',
    'ssi-dive-guide',
    'ssi-divemaster',
  ],
  CMAS: ['cmas-one-star', 'cmas-two-star', 'cmas-three-star'],
}

export function getCertificationsByAgency(
  agency: CertificationAgency,
): CertificationLevel[] {
  return CERTIFICATION_CATALOG.filter((item) => item.agency === agency)
}

export function getPrimaryCertifications(
  agency: CertificationAgency,
): CertificationLevel[] {
  return PRIMARY_CERTIFICATION_IDS[agency]
    .map((id) => getCertificationById(id))
    .filter((item): item is CertificationLevel => item !== undefined)
}

export function getCertificationById(
  certificationId: string,
): CertificationLevel | undefined {
  return CERTIFICATION_CATALOG.find((item) => item.id === certificationId)
}

export function getFixedDepthQualifications(
  agency: CertificationAgency,
): CertificationLevel[] {
  return CERTIFICATION_CATALOG.filter(
    (item) =>
      item.agency === agency &&
      item.depthRuleType === 'fixed' &&
      item.maxDepthM !== undefined,
  )
}
