import assert from 'node:assert/strict'
import type { Feature, Point } from 'geojson'
import {
  calculateDistanceNm,
  filterSitesByDistance,
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

console.log('Spatial verification: 3/3 checks passed.')
