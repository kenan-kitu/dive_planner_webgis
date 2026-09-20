import { diveCentersEnrichment } from './diveCentersEnrichment.ts'
import { diveSitesEnrichment } from './diveSitesEnrichment.ts'

const siteIsMinimal = (site: (typeof diveSitesEnrichment)[number]) =>
  site.matchStatus === 'unresolved' ||
  site.description === null ||
  (site.characteristics.length === 0 && site.highlights.length === 0)

const centerIsMinimal = (center: (typeof diveCentersEnrichment)[number]) =>
  center.matchStatus === 'unresolved' ||
  center.description === null ||
  center.sources.length === 0

export const enrichmentCoverage = {
  diveSites: {
    total: diveSitesEnrichment.length,
    enriched: diveSitesEnrichment.filter(
      (site) => site.matchStatus !== 'unresolved' && site.description !== null,
    ).length,
    withDescription: diveSitesEnrichment.filter((site) => site.description !== null).length,
    withEnDescription: diveSitesEnrichment.filter((site) => site.descriptionEn !== null).length,
    withTrDescription: diveSitesEnrichment.filter((site) => site.descriptionTr !== null).length,
    withPhoto: diveSitesEnrichment.filter((site) => site.photos.length >= 1).length,
    withThreePhotos: diveSitesEnrichment.filter((site) => site.photos.length >= 3).length,
    withAuthoritativeSource: diveSitesEnrichment.filter((site) =>
      site.sources.some((item) => item.authoritative),
    ).length,
    unresolvedOrMinimal: diveSitesEnrichment.filter(siteIsMinimal).map((site) => site.siteName),
  },
  diveCenters: {
    total: diveCentersEnrichment.length,
    enriched: diveCentersEnrichment.filter(
      (center) => center.matchStatus !== 'unresolved' && center.description !== null,
    ).length,
    withDescription: diveCentersEnrichment.filter((center) => center.description !== null).length,
    withEnDescription: diveCentersEnrichment.filter((center) => center.descriptionEn !== null).length,
    withTrDescription: diveCentersEnrichment.filter((center) => center.descriptionTr !== null).length,
    withOfficialWebsite: diveCentersEnrichment.filter((center) => center.website !== null).length,
    withPhone: diveCentersEnrichment.filter((center) => center.phone !== null).length,
    withAddress: diveCentersEnrichment.filter((center) => center.address !== null).length,
    withPhoto: diveCentersEnrichment.filter((center) => center.photos.length >= 1).length,
    withServices: diveCentersEnrichment.filter((center) => center.services.length >= 1).length,
    unresolvedOrMinimal: diveCentersEnrichment.filter(centerIsMinimal).map((center) => ({
      recordId: center.recordId,
      name: center.name,
    })),
  },
} as const
