import { useLanguage } from '../../i18n/LanguageContext'

interface ResultsSummaryProps {
  totalSiteCount: number
  matchingSiteCount: number
  depthMatchCount: number
  distanceMatchCount: number | null
  selectedDepartureName: string | null
}

export function ResultsSummary({
  totalSiteCount,
  matchingSiteCount,
  depthMatchCount,
  distanceMatchCount,
  selectedDepartureName,
}: ResultsSummaryProps) {
  const { t } = useLanguage()

  return (
    <section className="results-summary" aria-labelledby="results-title" aria-live="polite">
      <div>
        <p className="eyebrow">{t.planning.results}</p>
        <h2 id="results-title">{t.planning.matchingDiveSites}</h2>
      </div>
      <strong className="results-summary__count">
        {matchingSiteCount}
        <span> / {totalSiteCount}</span>
      </strong>
      <dl>
        <div>
          <dt>{t.planning.withinCertificationDepth}</dt>
          <dd>{depthMatchCount}</dd>
        </div>
        <div>
          <dt>{t.planning.withinBoatDistance}</dt>
          <dd>{distanceMatchCount ?? '—'}</dd>
        </div>
        <div>
          <dt>{t.planning.departurePoint}</dt>
          <dd>{selectedDepartureName ?? t.planning.noDepartureSelected}</dd>
        </div>
      </dl>
    </section>
  )
}
