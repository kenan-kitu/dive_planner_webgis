export type EnrichmentMatchStatus = 'verified' | 'partial' | 'unresolved'

export type EnrichmentSourceType =
  | 'government'
  | 'official-tourism'
  | 'official-business'
  | 'training-agency'
  | 'reference'

export interface EnrichmentSource {
  title: string
  url: string
  type: EnrichmentSourceType
  authoritative: boolean
}

export interface PhotoReference {
  url: string
  sourcePage: string
  sourceName: string
  caption: string
  captionEn?: string
  captionTr?: string
  attribution: string | null
  license: string | null
}

export interface KnownDepth {
  minimumMeters: number | null
  maximumMeters: number | null
  sourceText: string
}

export interface DiveSiteEnrichment {
  siteName: string
  canonicalName: string | null
  aliases: string[]
  summary: string | null
  summaryEn?: string | null
  summaryTr?: string | null
  description: string | null
  descriptionEn?: string | null
  descriptionTr?: string | null
  diveType: 'reef' | 'wall' | 'wreck' | null
  knownDepth: KnownDepth | null
  characteristics: string[]
  highlights: string[]
  highlightsEn?: string[]
  highlightsTr?: string[]
  marineLife: string[]
  marineLifeEn?: string[]
  marineLifeTr?: string[]
  visibility: string | null
  visibilityEn?: string | null
  visibilityTr?: string | null
  currentNotes: string | null
  currentNotesEn?: string | null
  currentNotesTr?: string | null
  experienceNotes: string | null
  experienceNotesEn?: string | null
  experienceNotesTr?: string | null
  history: string | null
  historyEn?: string | null
  historyTr?: string | null
  photos: PhotoReference[]
  sources: EnrichmentSource[]
  matchStatus: EnrichmentMatchStatus
  inferredFields: string[]
  researchNotes: string | null
}

export interface DiveCenterEnrichment {
  recordId: number
  name: string
  officialName: string | null
  description: string | null
  descriptionEn?: string | null
  descriptionTr?: string | null
  phone: string | null
  website: string | null
  address: string | null
  openingHours: string | null
  openingHoursEn?: string | null
  openingHoursTr?: string | null
  agencies: string[]
  services: string[]
  servicesEn?: string[]
  servicesTr?: string[]
  courses: string[]
  coursesEn?: string[]
  coursesTr?: string[]
  boatTrips: string[]
  boatTripsEn?: string[]
  boatTripsTr?: string[]
  rentals: string[]
  rentalsEn?: string[]
  rentalsTr?: string[]
  servedDiveSites: string[]
  socialUrls: string[]
  photos: PhotoReference[]
  sources: EnrichmentSource[]
  matchStatus: EnrichmentMatchStatus
  inferredFields: string[]
  researchNotes: string | null
}
