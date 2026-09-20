import {
  diveCentersEnrichment,
  diveSitesEnrichment,
} from '../data/enrichment/index.ts'
import type {
  DiveCenterEnrichment,
  DiveSiteEnrichment,
  PhotoReference,
} from '../data/enrichment/types.ts'

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
