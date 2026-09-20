import type { DiveSiteEnrichment } from '../../data/enrichment/types.ts'
import { useLanguage } from '../../i18n/LanguageContext'
import type { DeparturePointFeature, DiveCenterFeature, DiveSiteFeature } from '../../types/gis'
import type { DistanceResult } from '../../utils/spatial'
import { calculateTravelTimeMinutes } from '../../utils/spatial'
import { NearbyDiveCenters } from '../Planning/NearbyDiveCenters'
import { DetailList, DetailSources, DetailText } from './DetailParts'
import { PhotoGallery } from './PhotoGallery'

interface DiveSiteDetailsProps {
  site: DiveSiteFeature
  enrichment: DiveSiteEnrichment | null
  selectedDeparture: DeparturePointFeature | null
  directDistanceNm: number | null
  boatSpeedKnots: number
  nearbyCenters: readonly DistanceResult<DiveCenterFeature>[]
}

function depthRange(site: DiveSiteFeature, enrichment: DiveSiteEnrichment | null): string | null {
  const minimum = enrichment?.knownDepth
    ? enrichment.knownDepth.minimumMeters
    : site.properties.min_depth_m
  const maximum = enrichment?.knownDepth
    ? enrichment.knownDepth.maximumMeters
    : site.properties.max_depth_m
  if (minimum == null && maximum == null) return null
  if (minimum == null) return `≤ ${maximum} m`
  if (maximum == null) return `≥ ${minimum} m`
  return `${minimum}–${maximum} m`
}

export function DiveSiteDetails({
  site,
  enrichment,
  selectedDeparture,
  directDistanceNm,
  boatSpeedKnots,
  nearbyCenters,
}: DiveSiteDetailsProps) {
  const { t } = useLanguage()
  const properties = site.properties
  const type = enrichment?.diveType ?? properties.site_type
  const depth = depthRange(site, enrichment)
  const hasTrip = selectedDeparture && directDistanceNm != null

  return (
    <article className="rich-detail rich-detail--site" aria-labelledby="site-detail-title">
      <header className="rich-detail__header">
        <p className="eyebrow">{t.details.diveSiteDetails}</p>
        <h2 id="site-detail-title">{enrichment?.canonicalName ?? properties.site_name}</h2>
        {enrichment?.canonicalName && enrichment.canonicalName !== properties.site_name && (
          <small>{properties.site_name}</small>
        )}
      </header>

      {enrichment && <PhotoGallery photos={enrichment.photos} title={properties.site_name} />}

      <dl className="detail-facts">
        {type && <div><dt>{t.details.diveType}</dt><dd>{t.dataValues[type as keyof typeof t.dataValues] ?? type}</dd></div>}
        {depth && <div><dt>{t.details.depth}</dt><dd>{depth}</dd></div>}
        {(properties.data_quality || enrichment) && (
          <div>
            <dt>{t.details.dataStatus}</dt>
            <dd>{enrichment ? t.details.matchStatus[enrichment.matchStatus] : properties.data_quality}</dd>
          </div>
        )}
      </dl>

      <DetailText title={t.details.summary}>{enrichment?.summary}</DetailText>
      <DetailText title={t.details.description}>{enrichment?.description ?? properties.description}</DetailText>
      <DetailList title={t.details.highlights} items={enrichment?.highlights ?? []} />
      <DetailList title={t.details.marineLife} items={enrichment?.marineLife ?? []} />
      <DetailText title={t.details.visibility}>{enrichment?.visibility}</DetailText>
      <DetailText title={t.details.currents}>{enrichment?.currentNotes}</DetailText>
      <DetailText title={t.details.experience}>{enrichment?.experienceNotes}</DetailText>
      <DetailText title={t.details.history}>{enrichment?.history}</DetailText>

      {hasTrip && (
        <section className="detail-section detail-trip">
          <h3>{t.details.tripPlanning}</h3>
          <dl>
            <div><dt>{t.planning.departurePoint}</dt><dd>{selectedDeparture.properties.name}</dd></div>
            <div><dt>{t.planning.directBoatDistance}</dt><dd>{directDistanceNm.toFixed(1)} NM</dd></div>
            <div><dt>{t.planning.boatSpeed}</dt><dd>{boatSpeedKnots} {t.planning.knotAbbreviation}</dd></div>
            <div><dt>{t.planning.estimatedTravelTime}</dt><dd>{calculateTravelTimeMinutes(directDistanceNm, boatSpeedKnots)} {t.planning.minutes}</dd></div>
          </dl>
          <small>{t.planning.directRouteDisclaimer}</small>
        </section>
      )}

      <NearbyDiveCenters selectedDiveSiteName={properties.site_name} centers={nearbyCenters} compact />
      {enrichment && <DetailSources sources={enrichment.sources} />}
    </article>
  )
}
