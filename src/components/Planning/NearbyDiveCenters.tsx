import { useLanguage } from '../../i18n/LanguageContext'
import type { DiveCenterFeature } from '../../types/gis'
import type { DistanceResult } from '../../utils/spatial'
import {
  getDiveCenterEnrichment,
  localizedPhotoCaption,
  localizeDiveCenterEnrichment,
} from '../../utils/enrichment'

interface NearbyDiveCentersProps {
  selectedDiveSiteName: string
  centers: readonly DistanceResult<DiveCenterFeature>[]
  compact?: boolean
  onSelectCenter?: (center: DiveCenterFeature) => void
}

function safeWebsiteUrl(value: string | null): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function phoneUrl(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, '')}`
}

export function NearbyDiveCenters({
  selectedDiveSiteName,
  centers,
  compact = false,
  onSelectCenter,
}: NearbyDiveCentersProps) {
  const { language, t } = useLanguage()

  return (
    <section className={`nearby-centers${compact ? ' nearby-centers--compact' : ''}`} aria-labelledby="nearby-centers-title">
      <header>
        <div>
          <p className="eyebrow">{t.planning.selectedDiveSite}</p>
          <strong>{selectedDiveSiteName}</strong>
        </div>
        <h2 id="nearby-centers-title">{t.planning.nearbyDiveCenters}</h2>
      </header>

      {centers.length === 0 ? (
        <p className="nearby-centers__empty">
          {t.planning.noNearbyDiveCenters}
        </p>
      ) : (
        <ol className="nearby-centers__list">
          {centers.map(({ feature, distanceNm }) => {
            const { properties } = feature
            const enrichment = localizeDiveCenterEnrichment(
              getDiveCenterEnrichment(properties.record_id),
              language,
            )
            const website = safeWebsiteUrl(enrichment?.website ?? properties.website)
            const phone = enrichment?.phone ?? properties.phone
            const photo = enrichment?.photos[0]

            return (
              <li key={properties.record_id}>
                <article className="nearby-center-card">
                  {photo ? (
                    <img
                      className="nearby-center-card__image"
                      src={photo.url}
                      alt={localizedPhotoCaption(photo, language, enrichment?.officialName ?? properties.name)}
                      loading="lazy"
                      onError={(event) => { event.currentTarget.hidden = true }}
                    />
                  ) : null}
                  <header>
                    <strong>{enrichment?.officialName ?? properties.name}</strong>
                    <span
                      className="nearby-center-card__distance"
                      aria-label={`${t.planning.distance}: ${distanceNm.toFixed(1)} NM`}
                    >
                      {distanceNm.toFixed(1)} NM
                    </span>
                  </header>
                  {(phone || properties.address) ? (
                    <dl>
                      {phone ? (
                        <div>
                          <dt>{t.popup.phone}</dt>
                          <dd>
                            <a href={phoneUrl(phone)}>
                              {phone}
                            </a>
                          </dd>
                        </div>
                      ) : null}
                      {properties.address ? (
                        <div>
                          <dt>{t.popup.address}</dt>
                          <dd>{properties.address}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                  {enrichment?.services.length ? (
                    <p className="nearby-center-card__services">
                      {enrichment.services.slice(0, 3).join(' · ')}
                    </p>
                  ) : null}
                  {enrichment?.servedDiveSites.some(
                    (siteName) =>
                      siteName.toLocaleLowerCase() ===
                      selectedDiveSiteName.toLocaleLowerCase(),
                  ) ? (
                    <span className="nearby-center-card__verified">
                      {t.catalog.sourcedTripOperator}
                    </span>
                  ) : (
                    <span className="nearby-center-card__proximity">
                      {t.catalog.nearbyByDistance}
                    </span>
                  )}
                  {website ? (
                    <a
                      className="nearby-center-card__website"
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.popup.website}
                    </a>
                  ) : null}
                  {onSelectCenter ? (
                    <button type="button" onClick={() => onSelectCenter(feature)}>
                      {t.catalog.viewCenter}
                    </button>
                  ) : null}
                </article>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
