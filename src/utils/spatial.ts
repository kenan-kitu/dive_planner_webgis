import { circle, distance, greatCircle, point } from '@turf/turf'
import type {
  Feature,
  LineString,
  MultiLineString,
  Point,
  Polygon,
} from 'geojson'

const KILOMETERS_PER_NAUTICAL_MILE = 1.852

type PointFeature = Feature<Point>

export interface DistanceResult<T extends PointFeature> {
  feature: T
  distanceNm: number
}

export function nauticalMilesToKilometers(distanceNm: number): number {
  return distanceNm * KILOMETERS_PER_NAUTICAL_MILE
}

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

export function calculateTravelTimeMinutes(
  distanceNm: number,
  speedKnots: number,
): number {
  if (distanceNm < 0 || speedKnots <= 0) {
    throw new RangeError('Distance must be non-negative and speed must be positive.')
  }

  return Math.round((distanceNm / speedKnots) * 60)
}

export function createDirectRouteLine(
  from: PointFeature,
  to: PointFeature,
): Feature<LineString | MultiLineString> {
  return greatCircle(
    point(from.geometry.coordinates),
    point(to.geometry.coordinates),
    { npoints: 64 },
  )
}

export function createReachZone(
  departurePoint: PointFeature,
  maximumDistanceNm: number,
): Feature<Polygon> {
  return circle(
    point(departurePoint.geometry.coordinates),
    nauticalMilesToKilometers(maximumDistanceNm),
    { units: 'kilometers', steps: 72 },
  )
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

export function findNearestPoints<T extends PointFeature>(
  origin: PointFeature,
  candidates: readonly T[],
  limit = 3,
): DistanceResult<T>[] {
  if (limit <= 0) return []

  return candidates
    .map((feature) => ({
      feature,
      distanceNm: calculateDistanceNm(origin, feature),
    }))
    .sort((first, second) => first.distanceNm - second.distanceNm)
    .slice(0, limit)
}
