import assert from 'node:assert/strict'
import type {
  DeparturePointCollection,
  DiveCenterCollection,
  DiveSiteCollection,
  DiveSiteFeature,
} from '../src/types/gis.ts'
import { MAP_SYMBOL_COLORS } from '../src/config/mapSymbolPalette.ts'
import { getEffectiveDepthLimit, type DiverProfile } from '../src/utils/certification.ts'
import {
  createDiveSiteAnalysis,
  filterDiveSitesForJourney,
  getDiveSitePlanningDepths,
} from '../src/utils/siteFiltering.ts'

const WFS_URL = 'http://127.0.0.1:8080/geoserver/diveplanner/ows'

async function fetchLayer<T>(typeName: string): Promise<T> {
  const url = new URL(WFS_URL)
  url.search = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: `diveplanner:${typeName}`,
    outputFormat: 'application/json',
  }).toString()
  const response = await fetch(url)
  assert.equal(response.ok, true, `${typeName} WFS request must succeed`)
  return response.json() as Promise<T>
}

function names(sites: readonly DiveSiteFeature[]): string[] {
  return sites.map((site) => site.properties.site_name).sort()
}

function assertSubset(smaller: readonly DiveSiteFeature[], larger: readonly DiveSiteFeature[]) {
  const largerNames = new Set(names(larger))
  for (const name of names(smaller)) {
    assert.equal(largerNames.has(name), true, `${name} must remain eligible as depth increases`)
  }
}

function strictWreckResults(
  sites: readonly DiveSiteFeature[],
  depthLimit: number,
) {
  const analysis = createDiveSiteAnalysis(sites, depthLimit, 'wreck', null, 10)
  return filterDiveSitesForJourney(sites, analysis, 'none', false)
}

const [diveSites, diveCenters, departurePoints] = await Promise.all([
  fetchLayer<DiveSiteCollection>('dive_sites'),
  fetchLayer<DiveCenterCollection>('dive_centers_clean'),
  fetchLayer<DeparturePointCollection>('departure_points_clean'),
])

assert.equal(diveSites.features.length, 63, 'Local GeoServer dive-site count')
assert.equal(diveCenters.features.length, 19, 'Local GeoServer dive-center count')
assert.equal(departurePoints.features.length, 85, 'Local GeoServer departure count')

const adelaide = diveSites.features.find(
  (site) => site.properties.site_name === 'Adelaide Baker (Shipwreck Trail)',
)
const amesbury = diveSites.features.find(
  (site) => site.properties.site_name === 'Amesbury Wreck (Shipwreck Trail)',
)
assert.ok(adelaide)
assert.ok(amesbury)
assert.equal(adelaide.properties.site_type, 'Wreck')
assert.equal(adelaide.properties.max_depth_m, 28)
assert.equal(amesbury.properties.site_type, 'Wreck')
assert.equal(amesbury.properties.max_depth_m, 31)
assert.equal(getDiveSitePlanningDepths(adelaide).maximum, 6.1)
assert.equal(getDiveSitePlanningDepths(amesbury).maximum, 9.1)

const cmasProfiles: DiverProfile[] = [
  { agency: 'CMAS', certificationId: 'cmas-one-star' },
  { agency: 'CMAS', certificationId: 'cmas-two-star' },
  { agency: 'CMAS', certificationId: 'cmas-three-star' },
]
const cmasLimits = cmasProfiles.map(getEffectiveDepthLimit)
assert.deepEqual(cmasLimits, [20, 30, 40])
const [wrecks20, wrecks30, wrecks40] = cmasLimits.map((limit) =>
  strictWreckResults(diveSites.features, assertDepthLimit(limit)),
)

assertSubset(wrecks20, wrecks30)
assertSubset(wrecks30, wrecks40)
assert.equal(names(wrecks20).includes(adelaide.properties.site_name), true)
assert.equal(names(wrecks20).includes(amesbury.properties.site_name), true)

for (const [limit, results] of [
  [20, wrecks20],
  [30, wrecks30],
  [40, wrecks40],
] as const) {
  const expected = diveSites.features.filter((site) => {
    const maximum = getDiveSitePlanningDepths(site).maximum
    return (
      site.properties.site_type?.toLowerCase() === 'wreck' &&
      maximum !== null &&
      maximum <= limit
    )
  })
  assert.deepEqual(names(results), names(expected))
  assert.equal(
    results.every((site) => {
      const maximum = getDiveSitePlanningDepths(site).maximum
      return maximum !== null && maximum <= limit
    }),
    true,
  )
}

const agencyProfiles: DiverProfile[] = [
  { agency: 'PADI', certificationId: 'padi-open-water' },
  { agency: 'PADI', certificationId: 'padi-advanced-open-water' },
  { agency: 'SSI', certificationId: 'ssi-open-water' },
  {
    agency: 'SSI',
    certificationId: 'ssi-advanced-adventurer',
    conditionalConfirmed: true,
  },
]
for (const profile of agencyProfiles) {
  const limit = assertDepthLimit(getEffectiveDepthLimit(profile))
  const results = strictWreckResults(diveSites.features, limit)
  assert.equal(
    results.every((site) => {
      const maximum = getDiveSitePlanningDepths(site).maximum
      return maximum !== null && maximum <= limit
    }),
    true,
    `${profile.agency} strict results must obey its planning limit`,
  )
}

const departure = departurePoints.features[0]
assert.ok(departure)
const analysisWithStaleTrip = createDiveSiteAnalysis(
  diveSites.features,
  20,
  'wreck',
  departure,
  0.1,
)
const noTravelConstraint = filterDiveSitesForJourney(
  diveSites.features,
  analysisWithStaleTrip,
  'none',
  true,
)
const explicitDistanceConstraint = filterDiveSitesForJourney(
  diveSites.features,
  analysisWithStaleTrip,
  'departure',
  true,
)
assert.deepEqual(names(noTravelConstraint), names(wrecks20))
assert.ok(explicitDistanceConstraint.length < noTravelConstraint.length)

const uncertainSite: DiveSiteFeature = {
  ...adelaide,
  properties: {
    ...adelaide.properties,
    site_name: 'Uncertain depth regression fixture',
    min_depth_m: null,
    max_depth_m: null,
  },
}
const uncertainAnalysis = createDiveSiteAnalysis(
  [uncertainSite],
  40,
  'wreck',
  null,
  10,
)
assert.deepEqual(
  filterDiveSitesForJourney([uncertainSite], uncertainAnalysis, 'none', false),
  [],
  'A missing maximum depth must not be treated as zero',
)

const firstForty = names(strictWreckResults(diveSites.features, 40))
strictWreckResults(diveSites.features, 20)
const secondForty = names(strictWreckResults(diveSites.features, 40))
assert.deepEqual(secondForty, firstForty)

assert.notEqual(MAP_SYMBOL_COLORS.wall, MAP_SYMBOL_COLORS.reef)
assert.notEqual(MAP_SYMBOL_COLORS.wall, MAP_SYMBOL_COLORS.wreck)

function assertDepthLimit(limit: number | null): number {
  assert.notEqual(limit, null)
  return limit as number
}

console.log(
  `Site-filter regression passed: CMAS wrecks 20/30/40 m = ${wrecks20.length}/${wrecks30.length}/${wrecks40.length}; state isolation and PADI/SSI checks passed.`,
)
