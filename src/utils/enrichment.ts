import {
  diveCentersEnrichment,
  diveSitesEnrichment,
} from '../data/enrichment/index.ts'
import type {
  DiveCenterEnrichment,
  DiveSiteEnrichment,
  PhotoReference,
} from '../data/enrichment/types.ts'
import type { Language } from '../i18n/translations.ts'

const siteByName = new Map(
  diveSitesEnrichment.map((site) => [site.siteName, site] as const),
)
const centerByRecordId = new Map(
  diveCentersEnrichment.map((center) => [center.recordId, center] as const),
)

export function getDiveSiteEnrichment(
  siteName: string,
): DiveSiteEnrichment | null {
  return siteByName.get(siteName) ?? null
}

export function getDiveCenterEnrichment(
  recordId: number,
): DiveCenterEnrichment | null {
  return centerByRecordId.get(recordId) ?? null
}

export function availablePhotos(
  photos: readonly PhotoReference[],
  failedUrls: ReadonlySet<string>,
): PhotoReference[] {
  return photos.filter((photo) => !failedUrls.has(photo.url))
}

export function localizeDiveSiteEnrichment(
  site: DiveSiteEnrichment | null,
  language: Language,
): DiveSiteEnrichment | null {
  if (!site) return null
  if (language === 'en') {
    return {
      ...site,
      summary: site.summaryEn ?? site.summary,
      description: site.descriptionEn ?? site.description,
      highlights: site.highlightsEn ?? site.highlights,
      marineLife: site.marineLifeEn ?? site.marineLife,
      visibility: site.visibilityEn ?? site.visibility,
      currentNotes: site.currentNotesEn ?? site.currentNotes,
      experienceNotes: site.experienceNotesEn ?? site.experienceNotes,
      history: site.historyEn ?? site.history,
    }
  }
  return {
    ...site,
    summary: site.summaryTr ?? null,
    description: site.descriptionTr ?? null,
    highlights: site.highlightsTr ?? [],
    marineLife: site.marineLifeTr ?? [],
    visibility: site.visibilityTr ?? null,
    currentNotes: site.currentNotesTr ?? null,
    experienceNotes: site.experienceNotesTr ?? null,
    history: site.historyTr ?? null,
  }
}

export function localizeDiveCenterEnrichment(
  center: DiveCenterEnrichment | null,
  language: Language,
): DiveCenterEnrichment | null {
  if (!center) return null
  if (language === 'en') {
    return {
      ...center,
      description: center.descriptionEn ?? center.description,
      openingHours: center.openingHoursEn ?? center.openingHours,
      services: center.servicesEn ?? center.services,
      courses: center.coursesEn ?? center.courses,
      boatTrips: center.boatTripsEn ?? center.boatTrips,
      rentals: center.rentalsEn ?? center.rentals,
    }
  }
  return {
    ...center,
    description: center.descriptionTr ?? null,
    openingHours: center.openingHoursTr ?? null,
    services: center.servicesTr ?? [],
    courses: center.coursesTr ?? [],
    boatTrips: center.boatTripsTr ?? [],
    rentals: center.rentalsTr ?? [],
  }
}

export function localizedPhotoCaption(
  photo: PhotoReference,
  language: Language,
  subject: string,
): string {
  if (language === 'tr') return photo.captionTr ?? `${subject} görseli.`
  return photo.captionEn ?? photo.caption
}

export function localizedPhotoLicense(
  license: string | null,
  language: Language,
): string | null {
  if (!license || language === 'en' || license.startsWith('CC')) return license
  if (license === 'Public domain') return 'Kamu malı'
  if (license.startsWith('U.S. government work')) {
    return 'ABD kamu kurumu eseri; yeniden kullanım koşullarını kaynak sayfada doğrulayın'
  }
  return license
}
