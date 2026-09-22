import type {
  DeparturePointFeature,
  DiveSiteAnalysis,
  DiveSiteFeature,
} from '../types/gis.ts'
import { getDiveSiteEnrichment } from './enrichment.ts'
import { calculateDistanceNm } from './spatial.ts'

export type SiteTravelPreference = 'none' | 'short' | 'departure'

export interface DiveSitePlanningDepths {
  minimum: number | null
  maximum: number | null
  source: 'enrichment' | 'gis'
}

export function getDiveSitePlanningDepths(
  site: DiveSiteFeature,
): DiveSitePlanningDepths {
  const knownDepth = getDiveSiteEnrichment(site.properties.site_name)?.knownDepth

  // Keep each range from one source. A verified/enriched maximum is the value
  // shown to the user; otherwise the GeoServer attributes remain the fallback.
  if (knownDepth?.maximumMeters != null) {
    return {
      minimum: knownDepth.minimumMeters,
      maximum: knownDepth.maximumMeters,
      source: 'enrichment',
    }
  }

  return {
    minimum: site.properties.min_depth_m,
    maximum: site.properties.max_depth_m,
    source: 'gis',
  }
}

export function createDiveSiteAnalysis(
  sites: readonly DiveSiteFeature[],
  effectiveDepthLimit: number | null,
  selectedSiteType: string | null,
  selectedDeparture: DeparturePointFeature | null,
  maximumDistanceNm: number,
): Map<DiveSiteFeature, DiveSiteAnalysis> {
  const analysis = new Map<DiveSiteFeature, DiveSiteAnalysis>()

  for (const site of sites) {
    const maximumDepth = getDiveSitePlanningDepths(site).maximum
    const matchesDepth =
      effectiveDepthLimit === null ||
      (maximumDepth !== null && maximumDepth <= effectiveDepthLimit)
    const matchesType =
      selectedSiteType === null ||
      site.properties.site_type?.toLowerCase() === selectedSiteType.toLowerCase()
    const distanceNm = selectedDeparture
      ? calculateDistanceNm(selectedDeparture, site)
      : null
    const matchesDistance =
      distanceNm === null || distanceNm <= maximumDistanceNm

    analysis.set(site, {
      distanceNm,
      matchesDepth,
      matchesType,
      matchesDistance,
      isFullMatch: matchesDepth && matchesType && matchesDistance,
    })
  }

  return analysis
}

export function filterDiveSitesForJourney(
  sites: readonly DiveSiteFeature[],
  analysis: ReadonlyMap<DiveSiteFeature, DiveSiteAnalysis>,
  travelPreference: SiteTravelPreference,
  hasSelectedDeparture: boolean,
): DiveSiteFeature[] {
  return sites.filter((site) => {
    const result = analysis.get(site)
    if (!result?.matchesDepth || !result.matchesType) return false

    // Distance is deliberately ignored unless the user selected a travel
    // constraint during the current Find Dive Sites journey.
    if (travelPreference === 'none') return true
    if (!hasSelectedDeparture) return false
    if (travelPreference === 'short') {
      return result.distanceNm != null && result.distanceNm <= 5
    }
    return result.matchesDistance
  })
}
