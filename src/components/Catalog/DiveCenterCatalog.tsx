import { useLanguage } from '../../i18n/LanguageContext'
import type { DiveCenterFeature } from '../../types/gis'
import {
  getDiveCenterEnrichment,
  localizedPhotoCaption,
  localizeDiveCenterEnrichment,
} from '../../utils/enrichment'
import { CatalogMedia } from './CatalogMedia'

export interface CenterCatalogItem {
  center: DiveCenterFeature
  distanceNm?: number
}

interface DiveCenterCatalogProps {
  items: readonly CenterCatalogItem[]
  selectedCenter: DiveCenterFeature | null
  heading: string
  search?: string
  onSearchChange?: (value: string) => void
  onSelect: (center: DiveCenterFeature) => void
}

export function DiveCenterCatalog({
  items,
  selectedCenter,
  heading,
  search,
  onSearchChange,
  onSelect,
}: DiveCenterCatalogProps) {
  const { language, t } = useLanguage()

  return (
    <section className="catalog" aria-labelledby="dive-center-catalog-title">
      <header className="catalog__header">
        <div>
          <p className="eyebrow">{t.catalog.diveCenterCatalog}</p>
          <h2 id="dive-center-catalog-title">{heading}</h2>
        </div>
        <strong>{items.length}</strong>
      </header>

      {onSearchChange ? (
        <div className="catalog-filters">
          <label>
            <span>{t.catalog.searchDiveCenters}</span>
            <input
              type="search"
              value={search ?? ''}
              placeholder={t.catalog.searchDiveCentersPlaceholder}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="catalog-empty">
          <strong>{t.catalog.noDiveCenters}</strong>
          <span>{t.catalog.adjustSearch}</span>
        </div>
      ) : (
        <div className="catalog-grid catalog-grid--centers">
          {items.map(({ center, distanceNm }) => {
            const enrichment = localizeDiveCenterEnrichment(
              getDiveCenterEnrichment(center.properties.record_id),
              language,
            )
            const photo = enrichment?.photos[0]
            const isSelected = selectedCenter === center
            const services = enrichment?.services.slice(0, 3) ?? []

            return (
              <article
                className={`catalog-card catalog-card--center${isSelected ? ' is-selected' : ''}`}
                key={center.properties.record_id}
              >
                <CatalogMedia
                  src={photo?.url}
                  alt={photo ? localizedPhotoCaption(photo, language, enrichment?.officialName ?? center.properties.name) : ''}
                  fallback="+"
                />
                <div className="catalog-card__body">
                  <div>
                    <small>{t.dataValues.diveCenter}</small>
                    <h3>{enrichment?.officialName ?? center.properties.name}</h3>
                    {enrichment?.address ?? center.properties.address ? (
                      <p>{enrichment?.address ?? center.properties.address}</p>
                    ) : null}
                  </div>
                  {distanceNm != null ? (
                    <strong className="catalog-card__distance">
                      {distanceNm.toFixed(1)} NM
                    </strong>
                  ) : null}
                  {enrichment?.agencies.length ? (
                    <p className="catalog-card__tags">
                      {enrichment.agencies.join(' · ')}
                    </p>
                  ) : null}
                  {services.length ? (
                    <p className="catalog-card__summary">{services.join(' · ')}</p>
                  ) : null}
                  <button type="button" onClick={() => onSelect(center)}>
                    {t.catalog.viewCenter}
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
