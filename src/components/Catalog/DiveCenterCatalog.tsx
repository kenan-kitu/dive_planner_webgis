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

function safeWebsite(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

function phoneHref(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, '')}`
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
            const phone = enrichment?.phone ?? center.properties.phone
            const website = safeWebsite(enrichment?.website ?? center.properties.website)

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
                  {enrichment?.description ? (
                    <p className="catalog-card__summary">{enrichment.description}</p>
                  ) : null}
                  {phone || website ? (
                    <div className="catalog-card__contact">
                      {phone ? <a href={phoneHref(phone)}>{phone}</a> : null}
                      {website ? <a href={website} target="_blank" rel="noreferrer">{t.popup.visitWebsite}</a> : null}
                    </div>
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
