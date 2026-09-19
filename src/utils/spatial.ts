import { distance, point } from '@turf/turf'
import type { Feature, Point } from 'geojson'

const KILOMETERS_PER_NAUTICAL_MILE = 1.852

type PointFeature = Feature<Point>

export function calculateDistanceNm(
  from: PointFeature,
  to: PointFeature,
): number {
  const distanceKm = distance(
    point(from.geometry.coordinates),
    point(to.geometry.coordinates),
    { units: 'kilometers' },
  )

  return distanceKm / KILOMETERS_PER_NAUTICAL_MILE
}

export function filterSitesByDistance<T extends PointFeature>(
  sites: readonly T[],
  departurePoint: PointFeature,
  maximumDistanceNm: number,
): T[] {
  return sites.filter(
    (site) =>
      calculateDistanceNm(departurePoint, site) <= maximumDistanceNm,
  )
}
