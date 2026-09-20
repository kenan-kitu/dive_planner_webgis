import assert from 'node:assert/strict'
import { availablePhotos, getDiveCenterEnrichment, getDiveSiteEnrichment } from '../src/utils/enrichment.ts'

const enrichedSite = getDiveSiteEnrichment('Benwood Wreck (Shipwreck Trail)')
assert.ok(enrichedSite, 'Enriched dive site should match by stable GIS name')
assert.equal(enrichedSite.matchStatus, 'verified')
assert.ok(enrichedSite.description)
assert.ok(enrichedSite.photos.length >= 1)

const minimalSite = getDiveSiteEnrichment('Alligator Wreck')
assert.ok(minimalSite, 'Minimal site should still match without raising an error')
assert.equal(minimalSite.matchStatus, 'unresolved')
assert.equal(getDiveSiteEnrichment('Unknown GIS site'), null)

const enrichedCenter = getDiveCenterEnrichment(20)
assert.ok(enrichedCenter, 'Enriched dive center should match by stable record ID')
assert.equal(enrichedCenter.officialName, 'Lost Reef Adventures')
assert.ok(enrichedCenter.website)

const minimalCenter = getDiveCenterEnrichment(4)
assert.ok(minimalCenter, 'Minimal center should still match without raising an error')
assert.equal(minimalCenter.matchStatus, 'unresolved')
assert.equal(getDiveCenterEnrichment(99999), null)

const firstPhoto = enrichedSite.photos[0]
const remainingPhotos = availablePhotos(enrichedSite.photos, new Set([firstPhoto.url]))
assert.ok(remainingPhotos.every((photo) => photo.url !== firstPhoto.url))
assert.equal(remainingPhotos.length, enrichedSite.photos.length - 1)

console.log('Rich-detail data matching and image-failure fallback passed.')
