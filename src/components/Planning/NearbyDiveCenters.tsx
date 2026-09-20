import { useLanguage } from '../../i18n/LanguageContext'
import type { DiveCenterFeature } from '../../types/gis'
import type { DistanceResult } from '../../utils/spatial'

interface NearbyDiveCentersProps {
  selectedDiveSiteName: string
  centers: readonly DistanceResult<DiveCenterFeature>[]
  compact?: boolean
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
}: NearbyDiveCentersProps) {
  const { t } = useLanguage()

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
            const website = safeWebsiteUrl(properties.website)

            return (
              <li key={properties.record_id}>
                <article className="nearby-center-card">
                  <header>
                    <strong>{properties.name}</strong>
                    <span
                      className="nearby-center-card__distance"
                      aria-label={`${t.planning.distance}: ${distanceNm.toFixed(1)} NM`}
                    >
                      {distanceNm.toFixed(1)} NM
                    </span>
                  </header>
                  {(properties.phone || properties.address) && (
                    <dl>
                      {properties.phone && (
                        <div>
                          <dt>{t.popup.phone}</dt>
                          <dd>
                            <a href={phoneUrl(properties.phone)}>
                              {properties.phone}
                            </a>
                          </dd>
                        </div>
                      )}
                      {properties.address && (
                        <div>
                          <dt>{t.popup.address}</dt>
                          <dd>{properties.address}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                  {website && (
                    <a
                      className="nearby-center-card__website"
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.popup.website}
                    </a>
                  )}
                </article>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
