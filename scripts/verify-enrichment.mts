import assert from 'node:assert/strict'
import {
  diveCentersEnrichment,
  diveSitesEnrichment,
  enrichmentCoverage,
} from '../src/data/enrichment/index.ts'

const expectUnique = <T>(values: T[], label: string) => {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`)
}

const validateUrl = (value: string, label: string) => {
  const url = new URL(value)
  assert.ok(url.protocol === 'https:' || url.protocol === 'http:', `${label} must use HTTP(S)`)
  assert.ok(url.hostname.length > 0, `${label} must include a host`)
}

assert.equal(diveSitesEnrichment.length, 63, 'Expected all 63 dive sites')
assert.equal(diveCentersEnrichment.length, 19, 'Expected all 19 dive centers')
expectUnique(diveSitesEnrichment.map((site) => site.siteName), 'Dive-site names')
expectUnique(diveCentersEnrichment.map((center) => center.recordId), 'Dive-center record IDs')

for (const site of diveSitesEnrichment) {
  assert.ok(site.siteName.trim(), 'Every dive site must retain its GIS name')
  for (const item of site.sources) validateUrl(item.url, `${site.siteName} source`)
  for (const item of site.photos) {
    validateUrl(item.url, `${site.siteName} photo`)
    validateUrl(item.sourcePage, `${site.siteName} photo source page`)
    assert.ok(item.sourceName.trim(), `${site.siteName} photo source name is required`)
    assert.ok(item.caption.trim(), `${site.siteName} photo caption is required`)
  }
  if (site.inferredFields.length > 0) {
    assert.notEqual(site.matchStatus, 'verified', `${site.siteName} has inferred fields but is verified`)
  }
  if (site.descriptionEn) assert.ok(site.summaryEn, `${site.siteName} English summary is required`)
  if (site.descriptionTr) assert.ok(site.summaryTr, `${site.siteName} Turkish summary is required`)
}

for (const center of diveCentersEnrichment) {
  assert.ok(center.name.trim(), `Center ${center.recordId} must retain its GIS name`)
  if (center.website) validateUrl(center.website, `${center.name} website`)
  for (const item of center.socialUrls) validateUrl(item, `${center.name} social URL`)
  for (const item of center.sources) validateUrl(item.url, `${center.name} source`)
  for (const item of center.photos) {
    validateUrl(item.url, `${center.name} photo`)
    validateUrl(item.sourcePage, `${center.name} photo source page`)
    assert.ok(item.sourceName.trim(), `${center.name} photo source name is required`)
    assert.ok(item.caption.trim(), `${center.name} photo caption is required`)
  }
  if (center.inferredFields.length > 0) {
    assert.notEqual(center.matchStatus, 'verified', `${center.name} has inferred fields but is verified`)
  }
  if (center.descriptionEn) assert.ok(center.descriptionTr, `${center.name} Turkish description is required`)
}

assert.equal(enrichmentCoverage.diveSites.total, 63)
assert.equal(enrichmentCoverage.diveCenters.total, 19)

console.log(JSON.stringify(enrichmentCoverage, null, 2))
console.log('Enrichment verification passed.')
