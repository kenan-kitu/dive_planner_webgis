import { useMemo } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import type { CommunityDiveSiteCollection } from '../../types/gis'

interface CommunityDiveSiteCatalogProps {
  collection: CommunityDiveSiteCollection | null
  search?: string
  typeFilter?: string | null
}

function depthLabel(minimum: number | null, maximum: number | null, unavailable: string) {
  if (minimum == null && maximum == null) return unavailable
  if (minimum == null) return `${maximum} m`
  if (maximum == null) return `${minimum} m+`
  return `${minimum}–${maximum} m`
}

export function CommunityDiveSiteCatalog({
  collection,
  search = '',
  typeFilter = null,
}: CommunityDiveSiteCatalogProps) {
  const { t } = useLanguage()
  const sites = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    return (collection?.features ?? []).filter((site) => {
      const properties = site.properties
      const matchesSearch =
        !normalizedSearch ||
        properties.site_name.toLocaleLowerCase().includes(normalizedSearch) ||
        (properties.business_name ?? properties.submitter_name)
          .toLocaleLowerCase()
          .includes(normalizedSearch)
      const matchesType =
        !typeFilter || properties.site_type.toLocaleLowerCase() === typeFilter
      return matchesSearch && matchesType
    })
  }, [collection, search, typeFilter])

  if (!collection || collection.features.length === 0) return null

  return (
    <section className="catalog catalog--community" aria-labelledby="community-site-catalog-title">
      <header className="catalog__header">
        <div>
          <p className="eyebrow">{t.portal.contributedLabel}</p>
          <h2 id="community-site-catalog-title">{t.catalog.communityDiveSites}</h2>
        </div>
        <strong>{sites.length}</strong>
      </header>
      <p className="catalog-community-note">{t.catalog.communityDiveSitesNote}</p>

      {sites.length === 0 ? (
        <div className="catalog-empty"><span>{t.catalog.noCommunityDiveSites}</span></div>
      ) : (
        <div className="catalog-grid">
          {sites.map((site) => {
            const properties = site.properties
            const submittedBy = properties.business_name ?? properties.submitter_name
            const localizedType =
              t.dataValues[
                properties.site_type.toLocaleLowerCase() as 'reef' | 'wreck' | 'wall'
              ] ?? properties.site_type
            return (
              <article className="catalog-card catalog-card--community" key={String(site.id)}>
                <div className="catalog-card__community-mark" aria-hidden="true">◆</div>
                <div className="catalog-card__body">
                  <div><small>{localizedType}</small><h3>{properties.site_name}</h3></div>
                  <dl className="catalog-card__facts">
                    <div><dt>{t.popup.depthRange}</dt><dd>{depthLabel(properties.min_depth_m, properties.max_depth_m, t.popup.notAvailable)}</dd></div>
                    <div><dt>{t.portal.contributedBy}</dt><dd>{submittedBy}</dd></div>
                  </dl>
                  <p className="catalog-card__summary">{properties.description}</p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
