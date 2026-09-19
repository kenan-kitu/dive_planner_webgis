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
  description: string | null
  diveType: 'reef' | 'wall' | 'wreck' | null
  knownDepth: KnownDepth | null
  characteristics: string[]
  highlights: string[]
  marineLife: string[]
  visibility: string | null
  currentNotes: string | null
  experienceNotes: string | null
  history: string | null
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
  phone: string | null
  website: string | null
  address: string | null
  openingHours: string | null
  agencies: string[]
  services: string[]
  courses: string[]
  boatTrips: string[]
  rentals: string[]
  servedDiveSites: string[]
  socialUrls: string[]
  photos: PhotoReference[]
  sources: EnrichmentSource[]
  matchStatus: EnrichmentMatchStatus
  inferredFields: string[]
  researchNotes: string | null
}
