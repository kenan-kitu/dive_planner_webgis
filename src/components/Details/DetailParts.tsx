import type { ReactNode } from 'react'
import type { EnrichmentSource } from '../../data/enrichment/types.ts'
import { useLanguage } from '../../i18n/LanguageContext'

export function DetailList({ title, items }: { title: string; items: readonly string[] }) {
  if (items.length === 0) return null
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  )
}

export function DetailText({ title, children }: { title: string; children: ReactNode }) {
  if (!children) return null
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      <p>{children}</p>
    </section>
  )
}

export function DetailSources({ sources }: { sources: readonly EnrichmentSource[] }) {
  const { t } = useLanguage()
  if (sources.length === 0) return null
  return (
    <details className="detail-sources">
      <summary>{t.details.sources} ({sources.length})</summary>
      <ul>
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
            <span>{t.details.sourceTypes[source.type]}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
