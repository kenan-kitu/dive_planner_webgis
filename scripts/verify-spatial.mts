import assert from 'node:assert/strict'
import type { Feature, Point } from 'geojson'
import {
  calculateDistanceNm,
  calculateTravelTimeMinutes,
  createDirectRouteLine,
  createReachZone,
  filterSitesByDistance,
  nauticalMilesToKilometers,
} from '../src/utils/spatial.ts'

function pointFeature(longitude: number, latitude: number): Feature<Point> {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
  }
}

const departure = pointFeature(-81, 24)
const sameLocation = pointFeature(-81, 24)
const oneLatitudeDegreeNorth = pointFeature(-81, 25)

assert.equal(calculateDistanceNm(departure, sameLocation), 0)

const oneDegreeDistanceNm = calculateDistanceNm(
  departure,
  oneLatitudeDegreeNorth,
)
assert.ok(oneDegreeDistanceNm > 59 && oneDegreeDistanceNm < 61)

assert.deepEqual(
  filterSitesByDistance(
    [sameLocation, oneLatitudeDegreeNorth],
    departure,
    10,
  ),
  [sameLocation],
)

assert.equal(nauticalMilesToKilometers(10), 18.52)
assert.equal(calculateTravelTimeMinutes(8.5, 20), 26)

const route = createDirectRouteLine(departure, oneLatitudeDegreeNorth)
assert.equal(route.geometry.type, 'LineString')
if (route.geometry.type !== 'LineString') {
  throw new Error('Expected a LineString for this non-antimeridian route.')
}
assert.deepEqual(route.geometry.coordinates[0], departure.geometry.coordinates)
assert.deepEqual(
  route.geometry.coordinates.at(-1),
  oneLatitudeDegreeNorth.geometry.coordinates,
)

const fiveNmZone = createReachZone(departure, 5)
const tenNmZone = createReachZone(departure, 10)
assert.equal(fiveNmZone.geometry.type, 'Polygon')

const fiveNmEdge = pointFeature(...fiveNmZone.geometry.coordinates[0][0])
const tenNmEdge = pointFeature(...tenNmZone.geometry.coordinates[0][0])
assert.ok(Math.abs(calculateDistanceNm(departure, fiveNmEdge) - 5) < 0.05)
assert.ok(Math.abs(calculateDistanceNm(departure, tenNmEdge) - 10) < 0.05)

console.log('Spatial verification: 11/11 checks passed.')
