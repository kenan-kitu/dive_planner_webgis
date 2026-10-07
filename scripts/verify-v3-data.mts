import { readFileSync } from 'node:fs'

const expected = new Map([
  ['public/data/dive_sites.geojson', 63],
  ['public/data/dive_centers.geojson', 19],
  ['public/data/departure_points.geojson', 85],
])

for (const [filename, count] of expected) {
  const collection = JSON.parse(readFileSync(filename, 'utf8')) as {
    type: string
    features: Array<{ geometry: { type: string; coordinates: number[] } }>
  }
  if (collection.type !== 'FeatureCollection' || collection.features.length !== count) {
    throw new Error(`${filename}: expected ${count} features`)
  }
  if (collection.features.some((feature) => feature.geometry.type !== 'Point')) {
    throw new Error(`${filename}: non-Point geometry found`)
  }
  console.log(`PASS ${filename}: ${count}`)
}

const productionFiles = [
  'cloudflare/worker.js',
  'wrangler.jsonc',
  'src/services/officialData.ts',
]
const forbidden = [/onrender\.com/i, /127\.0\.0\.1/i, /localhost/i, /\/geoserver\//i]
for (const filename of productionFiles) {
  const content = readFileSync(filename, 'utf8')
  if (forbidden.some((pattern) => pattern.test(content))) {
    throw new Error(`${filename}: production dependency found`)
  }
}
console.log('PASS V3 production routing has no Render, GeoServer or localhost dependency')
