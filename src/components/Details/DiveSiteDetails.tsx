import type { DiveSiteEnrichment } from '../../data/enrichment/types.ts'
import { useLanguage } from '../../i18n/LanguageContext'
import type { DeparturePointFeature, DiveSiteFeature } from '../../types/gis'
import type { DistanceResult } from '../../utils/spatial'
import { calculateTravelTimeMinutes } from '../../utils/spatial'
import { localizeDiveSiteEnrichment } from '../../utils/enrichment'
import { getDiveSitePlanningDepths } from '../../utils/siteFiltering'
import { DetailList, DetailSources, DetailText } from './DetailParts'
import { PhotoGallery } from './PhotoGallery'

interface DiveSiteDetailsProps {
  site: DiveSiteFeature
  enrichment: DiveSiteEnrichment | null
  selectedDeparture: DeparturePointFeature | null
  directDistanceNm: number | null
  boatSpeedKnots: number
  nearbyDepartures: readonly DistanceResult<DeparturePointFeature>[]
  certificationLabel: string | null
  effectiveDepthLimit: number | null
  onFindDiveCenters: () => void
  onPlanBoatTrip: () => void
  onShowOnMap: () => void
}

function departureTypeLabel(
  value: string | null | undefined,
  dataValues: { marina: string; boatRamp: string; departurePoint: string },
): string {
  const normalized = value?.toLowerCase().replace(/[_-]/g, ' ')
  if (normalized === 'marina') return dataValues.marina
  if (normalized === 'boat ramp' || normalized === 'ramp') return dataValues.boatRamp
  return dataValues.departurePoint
}

export function DiveSiteDetails({
  site,
  enrichment,
  selectedDeparture,
  directDistanceNm,
  boatSpeedKnots,
  nearbyDepartures,
  certificationLabel,
  effectiveDepthLimit,
  onFindDiveCenters,
  onPlanBoatTrip,
  onShowOnMap,
}: DiveSiteDetailsProps) {
  const { language, t } = useLanguage()
  const localizedEnrichment = localizeDiveSiteEnrichment(enrichment, language)
  const properties = site.properties
  const type = localizedEnrichment?.diveType ?? properties.site_type
  const depth = getDiveSitePlanningDepths(site)
  const hasTrip = selectedDeparture && directDistanceNm != null
  const matchesCertification =
    effectiveDepthLimit == null ||
    (depth.maximum != null && depth.maximum <= effectiveDepthLimit)

  return (
    <article className="rich-detail rich-detail--site" aria-labelledby="site-detail-title">
      <header className="rich-detail__header">
        <p className="eyebrow">{t.details.diveSiteDetails}</p>
        <h2 id="site-detail-title">{localizedEnrichment?.canonicalName ?? properties.site_name}</h2>
        {localizedEnrichment?.canonicalName && localizedEnrichment.canonicalName !== properties.site_name && (
          <small>{properties.site_name}</small>
        )}
      </header>

      {localizedEnrichment && <PhotoGallery photos={localizedEnrichment.photos} title={localizedEnrichment.canonicalName ?? properties.site_name} />}

      <dl className="detail-facts">
        {type && <div><dt>{t.details.diveType}</dt><dd>{t.dataValues[type as keyof typeof t.dataValues] ?? type}</dd></div>}
        <div><dt>{t.details.minimumDepth}</dt><dd>{depth.minimum == null ? t.popup.notAvailable : `${depth.minimum} m`}</dd></div>
        <div><dt>{t.details.maximumDepth}</dt><dd>{depth.maximum == null ? t.popup.notAvailable : `${depth.maximum} m`}</dd></div>
        {certificationLabel && effectiveDepthLimit != null ? (
          <div>
            <dt>{t.catalog.certificationMatch}</dt>
            <dd className={matchesCertification ? 'is-match' : 'is-warning'}>
              {matchesCertification ? t.catalog.withinDepth : t.catalog.exceedsDepth}
            </dd>
          </div>
        ) : null}
        {(properties.data_quality || localizedEnrichment) && (
          <div>
            <dt>{t.details.dataStatus}</dt>
            <dd>{localizedEnrichment ? t.details.matchStatus[localizedEnrichment.matchStatus] : properties.data_quality}</dd>
          </div>
        )}
      </dl>

      <DetailText title={t.details.summary}>{localizedEnrichment?.summary}</DetailText>
      <DetailText title={t.details.description}>{localizedEnrichment?.description ?? (language === 'en' ? properties.description : null)}</DetailText>
      <DetailList title={t.details.highlights} items={localizedEnrichment?.highlights ?? []} />
      <DetailList title={t.details.marineLife} items={localizedEnrichment?.marineLife ?? []} />
      <DetailText title={t.details.visibility}>{localizedEnrichment?.visibility}</DetailText>
      <DetailText title={t.details.currents}>{localizedEnrichment?.currentNotes}</DetailText>
      <DetailText title={t.details.experience}>{localizedEnrichment?.experienceNotes}</DetailText>
      <DetailText title={t.details.history}>{localizedEnrichment?.history}</DetailText>

      {certificationLabel && effectiveDepthLimit != null ? (
        <section className="detail-section detail-suitability">
          <h3>{t.catalog.suitabilityForYou}</h3>
          <dl>
            <div>
              <dt>{t.planning.certification}</dt>
              <dd>{certificationLabel}</dd>
            </div>
            <div>
              <dt>{t.catalog.planningDepthLimit}</dt>
              <dd>{effectiveDepthLimit} m</dd>
            </div>
          </dl>
        </section>
      ) : null}

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

      <section className="detail-section detail-primary-action">
        <h3>{t.planning.divePlanning}</h3>
        <div className="detail-action-grid">
          <button type="button" onClick={onFindDiveCenters}>
            {t.catalog.findDiveCenterForSite}
          </button>
          <button type="button" onClick={onPlanBoatTrip}>
            {t.catalog.planBoatTripForSite}
          </button>
          <button type="button" onClick={onShowOnMap}>
            {t.catalog.showOnMap}
          </button>
        </div>
      </section>

      <section className="detail-section nearby-departures">
        <h3>{t.catalog.nearbyDepartures}</h3>
        {nearbyDepartures.length ? (
          <ol>
            {nearbyDepartures.map(({ feature, distanceNm }) => (
              <li key={feature.properties.record_id}>
                <div>
                  <strong>{feature.properties.name}</strong>
                  <span>{departureTypeLabel(feature.properties.type, t.dataValues)}</span>
                </div>
                <dl>
                  <div>
                    <dt>{t.planning.directBoatDistance}</dt>
                    <dd>{distanceNm.toFixed(1)} NM</dd>
                  </div>
                  <div>
                    <dt>{t.planning.estimatedTravelTime}</dt>
                    <dd>
                      ~{calculateTravelTimeMinutes(distanceNm, boatSpeedKnots)}{' '}
                      {t.planning.minutes}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        ) : (
          <p>{t.catalog.noDepartureOptions}</p>
        )}
        <small>{t.catalog.departureDisclaimer}</small>
      </section>
      {localizedEnrichment && <DetailSources sources={localizedEnrichment.sources} />}
    </article>
  )
}
