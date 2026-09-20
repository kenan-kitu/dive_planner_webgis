import type { DiveCenterEnrichment } from '../../data/enrichment/types.ts'
import { useLanguage } from '../../i18n/LanguageContext'
import type { DiveCenterFeature, DiveSiteFeature } from '../../types/gis'
import type { DistanceResult } from '../../utils/spatial'
import { DetailList, DetailSources, DetailText } from './DetailParts'
import { PhotoGallery } from './PhotoGallery'
import { localizeDiveCenterEnrichment } from '../../utils/enrichment'

interface DiveCenterDetailsProps {
  center: DiveCenterFeature
  enrichment: DiveCenterEnrichment | null
  nearbySites: readonly DistanceResult<DiveSiteFeature>[]
  onSelectSite: (site: DiveSiteFeature) => void
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

export function DiveCenterDetails({
  center,
  enrichment,
  nearbySites,
  onSelectSite,
}: DiveCenterDetailsProps) {
  const { language, t } = useLanguage()
  const localizedEnrichment = localizeDiveCenterEnrichment(enrichment, language)
  const properties = center.properties
  const name = localizedEnrichment?.officialName ?? properties.name
  const phone = localizedEnrichment?.phone ?? properties.phone
  const address = localizedEnrichment?.address ?? properties.address
  const website = safeWebsite(localizedEnrichment?.website ?? properties.website)

  return (
    <article className="rich-detail rich-detail--center" aria-labelledby="center-detail-title">
      <header className="rich-detail__header">
        <p className="eyebrow">{t.details.diveCenterDetails}</p>
        <h2 id="center-detail-title">{name}</h2>
        {name !== properties.name && <small>{properties.name}</small>}
      </header>

      {localizedEnrichment && <PhotoGallery photos={localizedEnrichment.photos} title={name} />}
      <DetailText title={t.details.description}>{localizedEnrichment?.description}</DetailText>

      <dl className="detail-facts detail-facts--contact">
        {address && <div><dt>{t.popup.address}</dt><dd>{address}</dd></div>}
        {phone && <div><dt>{t.popup.phone}</dt><dd><a href={phoneHref(phone)}>{phone}</a></dd></div>}
        {website && <div><dt>{t.popup.website}</dt><dd><a href={website} target="_blank" rel="noreferrer">{t.popup.visitWebsite}</a></dd></div>}
        {localizedEnrichment?.openingHours && <div><dt>{t.details.openingHours}</dt><dd>{localizedEnrichment.openingHours}</dd></div>}
      </dl>

      <DetailList title={t.details.agencies} items={localizedEnrichment?.agencies ?? []} />
      <DetailList title={t.details.services} items={localizedEnrichment?.services ?? []} />
      <DetailList title={t.details.courses} items={localizedEnrichment?.courses ?? []} />
      <DetailList title={t.details.rentals} items={localizedEnrichment?.rentals ?? []} />
      <DetailList title={t.details.boatTrips} items={localizedEnrichment?.boatTrips ?? []} />
      <section className="detail-section nearby-sites">
        <h3>{t.catalog.nearbyDiveSites}</h3>
        <p>{t.catalog.proximityOnly}</p>
        {nearbySites.length ? (
          <ol>
            {nearbySites.map(({ feature, distanceNm }) => (
              <li key={feature.properties.site_name}>
                <div>
                  <strong>{feature.properties.site_name}</strong>
                  <span>{distanceNm.toFixed(1)} NM</span>
                </div>
                <button type="button" onClick={() => onSelectSite(feature)}>
                  {t.catalog.viewDetails}
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p>{t.catalog.noDiveSites}</p>
        )}
      </section>
      {localizedEnrichment && <DetailSources sources={localizedEnrichment.sources} />}
    </article>
  )
}
