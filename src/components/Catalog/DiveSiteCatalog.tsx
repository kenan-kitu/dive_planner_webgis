import type { DiveSiteEnrichment } from '../../data/enrichment/types'
import { useLanguage } from '../../i18n/LanguageContext'
import type { DiveSiteAnalysis, DiveSiteFeature } from '../../types/gis'
import { getDiveSiteEnrichment } from '../../utils/enrichment'
import { calculateTravelTimeMinutes } from '../../utils/spatial'

interface DiveSiteCatalogProps {
  sites: readonly DiveSiteFeature[]
  analysis: ReadonlyMap<DiveSiteFeature, DiveSiteAnalysis>
  selectedSite: DiveSiteFeature | null
  boatSpeedKnots: number
  heading: string
  search?: string
  typeFilter?: string | null
  onSearchChange?: (value: string) => void
  onTypeFilterChange?: (value: string | null) => void
  onSelect: (site: DiveSiteFeature) => void
}

function depthLabel(
  site: DiveSiteFeature,
  enrichment: DiveSiteEnrichment | null,
): string {
  const minimum = enrichment?.knownDepth
    ? enrichment.knownDepth.minimumMeters
    : site.properties.min_depth_m
  const maximum = enrichment?.knownDepth
    ? enrichment.knownDepth.maximumMeters
    : site.properties.max_depth_m
  if (minimum == null && maximum == null) return '—'
  if (minimum == null) return `≤ ${maximum} m`
  if (maximum == null) return `≥ ${minimum} m`
  return `${minimum}–${maximum} m`
}

export function DiveSiteCatalog({
  sites,
  analysis,
  selectedSite,
  boatSpeedKnots,
  heading,
  search,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
  onSelect,
}: DiveSiteCatalogProps) {
  const { t } = useLanguage()
  const showFilters = onSearchChange && onTypeFilterChange

  return (
    <section className="catalog" aria-labelledby="dive-site-catalog-title">
      <header className="catalog__header">
        <div>
          <p className="eyebrow">{t.catalog.diveSiteCatalog}</p>
          <h2 id="dive-site-catalog-title">{heading}</h2>
        </div>
        <strong>{sites.length}</strong>
      </header>

      {showFilters ? (
        <div className="catalog-filters">
          <label>
            <span>{t.catalog.searchDiveSites}</span>
            <input
              type="search"
              value={search ?? ''}
              placeholder={t.catalog.searchDiveSitesPlaceholder}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <div className="catalog-filter-chips" aria-label={t.catalog.diveTypeFilter}>
            {[null, 'reef', 'wreck', 'wall'].map((value) => (
              <button
                type="button"
                className={typeFilter === value ? 'is-active' : ''}
                aria-pressed={typeFilter === value}
                key={value ?? 'all'}
                onClick={() => onTypeFilterChange(value)}
              >
                {value
                  ? t.dataValues[value as 'reef' | 'wreck' | 'wall']
                  : t.planning.allDiveTypes}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {sites.length === 0 ? (
        <div className="catalog-empty">
          <strong>{t.catalog.noDiveSites}</strong>
          <span>{t.catalog.adjustAnswers}</span>
        </div>
      ) : (
        <div className="catalog-grid">
          {sites.map((site) => {
            const enrichment = getDiveSiteEnrichment(site.properties.site_name)
            const photo = enrichment?.photos[0]
            const result = analysis.get(site)
            const isSelected = selectedSite === site
            const type = enrichment?.diveType ?? site.properties.site_type

            return (
              <article
                className={`catalog-card${isSelected ? ' is-selected' : ''}`}
                key={site.properties.site_name}
              >
                <div className="catalog-card__media">
                  {photo ? (
                    <img src={photo.url} alt={photo.caption} loading="lazy" />
                  ) : (
                    <span aria-hidden="true">◎</span>
                  )}
                </div>
                <div className="catalog-card__body">
                  <div>
                    <small>
                      {type
                        ? (t.dataValues[type as 'reef' | 'wreck' | 'wall'] ?? type)
                        : t.popup.notListed}
                    </small>
                    <h3>{enrichment?.canonicalName ?? site.properties.site_name}</h3>
                    <p>{depthLabel(site, enrichment)}</p>
                  </div>
                  {enrichment?.summary ? (
                    <p className="catalog-card__summary">{enrichment.summary}</p>
                  ) : null}
                  <dl className="catalog-card__facts">
                    {result ? (
                      <div>
                        <dt>{t.catalog.certificationMatch}</dt>
                        <dd>
                          {result.matchesDepth
                            ? t.catalog.withinDepth
                            : t.catalog.exceedsDepth}
                        </dd>
                      </div>
                    ) : null}
                    {result?.distanceNm != null ? (
                      <>
                        <div>
                          <dt>{t.planning.distance}</dt>
                          <dd>{result.distanceNm.toFixed(1)} NM</dd>
                        </div>
                        <div>
                          <dt>{t.planning.estimatedTravelTime}</dt>
                          <dd>
                            {calculateTravelTimeMinutes(
                              result.distanceNm,
                              boatSpeedKnots,
                            )}{' '}
                            {t.planning.minutes}
                          </dd>
                        </div>
                      </>
                    ) : null}
                  </dl>
                  <button type="button" onClick={() => onSelect(site)}>
                    {t.catalog.viewDetails}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
