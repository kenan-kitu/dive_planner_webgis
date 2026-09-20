import type { DiveCenterEnrichment } from '../../data/enrichment/types.ts'
import { useLanguage } from '../../i18n/LanguageContext'
import type { DiveCenterFeature } from '../../types/gis'
import { DetailList, DetailSources, DetailText } from './DetailParts'
import { PhotoGallery } from './PhotoGallery'

interface DiveCenterDetailsProps {
  center: DiveCenterFeature
  enrichment: DiveCenterEnrichment | null
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

export function DiveCenterDetails({ center, enrichment }: DiveCenterDetailsProps) {
  const { t } = useLanguage()
  const properties = center.properties
  const name = enrichment?.officialName ?? properties.name
  const phone = enrichment?.phone ?? properties.phone
  const address = enrichment?.address ?? properties.address
  const website = safeWebsite(enrichment?.website ?? properties.website)

  return (
    <article className="rich-detail rich-detail--center" aria-labelledby="center-detail-title">
      <header className="rich-detail__header">
        <p className="eyebrow">{t.details.diveCenterDetails}</p>
        <h2 id="center-detail-title">{name}</h2>
        {name !== properties.name && <small>{properties.name}</small>}
      </header>

      {enrichment && <PhotoGallery photos={enrichment.photos} title={name} />}
      <DetailText title={t.details.description}>{enrichment?.description}</DetailText>

      <dl className="detail-facts detail-facts--contact">
        {address && <div><dt>{t.popup.address}</dt><dd>{address}</dd></div>}
        {phone && <div><dt>{t.popup.phone}</dt><dd><a href={phoneHref(phone)}>{phone}</a></dd></div>}
        {website && <div><dt>{t.popup.website}</dt><dd><a href={website} target="_blank" rel="noreferrer">{t.popup.visitWebsite}</a></dd></div>}
        {enrichment?.openingHours && <div><dt>{t.details.openingHours}</dt><dd>{enrichment.openingHours}</dd></div>}
      </dl>

      <DetailList title={t.details.agencies} items={enrichment?.agencies ?? []} />
      <DetailList title={t.details.services} items={enrichment?.services ?? []} />
      <DetailList title={t.details.courses} items={enrichment?.courses ?? []} />
      <DetailList title={t.details.rentals} items={enrichment?.rentals ?? []} />
      <DetailList title={t.details.boatTrips} items={enrichment?.boatTrips ?? []} />
      {enrichment && <DetailSources sources={enrichment.sources} />}
    </article>
  )
}
