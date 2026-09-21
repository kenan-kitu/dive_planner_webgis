import { DiverProfile } from '../Certification/DiverProfile'
import { useLanguage } from '../../i18n/LanguageContext'
import type {
  DeparturePointCollection,
  DiveSiteFeature,
} from '../../types/gis'
import type { DiverProfile as DiverProfileValue } from '../../utils/certification'

export type TravelPreference = 'none' | 'short' | 'departure'
export type CenterJourney = 'site' | 'browse'
export type SiteMatchStep = 'certification' | 'type' | 'travel' | 'results'
export type BoatTripStep = 'departure' | 'distance' | 'speed' | 'results'

interface SiteMatchQuestionsProps {
  step: SiteMatchStep
  profile: DiverProfileValue
  effectiveDepthLimit: number | null
  matchingSiteCount: number
  totalSiteCount: number
  selectedSiteType: string | null
  travelPreference: TravelPreference
  departurePoints: DeparturePointCollection | null
  selectedDepartureId: number | null
  maximumDistanceNm: number
  onProfileChange: (profile: DiverProfileValue) => void
  onSiteTypeChange: (siteType: string | null) => void
  onTravelPreferenceChange: (preference: TravelPreference) => void
  onDepartureChange: (recordId: number | null) => void
  onMaximumDistanceChange: (distanceNm: number) => void
  onBack: () => void
  onNext: () => void
}

function DepartureSelect({
  departurePoints,
  selectedDepartureId,
  onDepartureChange,
}: Pick<
  SiteMatchQuestionsProps,
  'departurePoints' | 'selectedDepartureId' | 'onDepartureChange'
>) {
  const { t } = useLanguage()
  const departures = [...(departurePoints?.features ?? [])].sort((a, b) =>
    a.properties.name.localeCompare(b.properties.name),
  )

  return (
    <label className="journey-field">
      <span>{t.planning.departurePoint}</span>
      <select
        value={selectedDepartureId ?? ''}
        onChange={(event) =>
          onDepartureChange(event.target.value ? Number(event.target.value) : null)
        }
      >
        <option value="">{t.planning.selectDeparture}</option>
        {departures.map((departure) => (
          <option
            key={departure.properties.record_id}
            value={departure.properties.record_id}
          >
            {departure.properties.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export function SiteMatchQuestions({
  step,
  profile,
  effectiveDepthLimit,
  matchingSiteCount,
  totalSiteCount,
  selectedSiteType,
  travelPreference,
  departurePoints,
  selectedDepartureId,
  maximumDistanceNm,
  onProfileChange,
  onSiteTypeChange,
  onTravelPreferenceChange,
  onDepartureChange,
  onMaximumDistanceChange,
  onBack,
  onNext,
}: SiteMatchQuestionsProps) {
  const { t } = useLanguage()
  const stepNumber = ['certification', 'type', 'travel'].indexOf(step) + 1

  return (
    <section className="journey-questions">
      <header>
        <p className="eyebrow">{t.catalog.stepProgress.replace('{current}', String(stepNumber)).replace('{total}', '3')}</p>
        <h2>{t.catalog.tellUsAboutDive}</h2>
      </header>
      {step === 'certification' ? <DiverProfile
        profile={profile}
        effectiveDepthLimit={effectiveDepthLimit}
        matchingSiteCount={matchingSiteCount}
        totalSiteCount={totalSiteCount}
        showMatchingSiteCount={false}
        onChange={onProfileChange}
      /> : null}
      {step === 'type' ? <label className="journey-field">
        <span>{t.catalog.preferredDiveType}</span>
        <select
          value={selectedSiteType ?? ''}
          onChange={(event) => onSiteTypeChange(event.target.value || null)}
        >
          <option value="">{t.planning.allDiveTypes}</option>
          <option value="reef">{t.dataValues.reef}</option>
          <option value="wreck">{t.dataValues.wreck}</option>
          <option value="wall">{t.dataValues.wall}</option>
        </select>
      </label> : null}
      {step === 'travel' ? <><label className="journey-field">
        <span>{t.catalog.travelPreference}</span>
        <select
          value={travelPreference}
          onChange={(event) =>
            onTravelPreferenceChange(event.target.value as TravelPreference)
          }
        >
          <option value="none">{t.catalog.noTravelPreference}</option>
          <option value="short">{t.catalog.shortBoatTrip}</option>
          <option value="departure">{t.catalog.knowDeparture}</option>
        </select>
      </label>
      {travelPreference !== 'none' ? (
        <DepartureSelect
          departurePoints={departurePoints}
          selectedDepartureId={selectedDepartureId}
          onDepartureChange={onDepartureChange}
        />
      ) : null}
      {travelPreference === 'departure' && selectedDepartureId != null ? (
        <label className="journey-range">
          <span>
            {t.planning.maximumBoatDistance}
            <strong>{maximumDistanceNm} NM</strong>
          </span>
          <input
            type="range"
            min="1"
            max="30"
            value={maximumDistanceNm}
            onChange={(event) =>
              onMaximumDistanceChange(Number(event.target.value))
            }
          />
        </label>
      ) : null}</> : null}
      <div className="journey-navigation">
        {step !== 'certification' ? <button type="button" onClick={onBack}>{t.catalog.back}</button> : <span />}
        <button type="button" className="is-primary" onClick={onNext}>
          {step === 'travel' ? t.catalog.showResults : t.catalog.next}
        </button>
      </div>
    </section>
  )
}

interface BoatTripQuestionsProps {
  step: BoatTripStep
  departurePoints: DeparturePointCollection | null
  selectedDepartureId: number | null
  boatSpeedKnots: number
  maximumDistanceNm: number
  onDepartureChange: (recordId: number | null) => void
  onBoatSpeedChange: (speedKnots: number) => void
  onMaximumDistanceChange: (distanceNm: number) => void
  onBack: () => void
  onNext: () => void
}

export function BoatTripQuestions({
  step,
  departurePoints,
  selectedDepartureId,
  boatSpeedKnots,
  maximumDistanceNm,
  onDepartureChange,
  onBoatSpeedChange,
  onMaximumDistanceChange,
  onBack,
  onNext,
}: BoatTripQuestionsProps) {
  const { t } = useLanguage()
  const stepNumber = ['departure', 'distance', 'speed'].indexOf(step) + 1

  return (
    <section className="journey-questions">
      <header>
        <p className="eyebrow">{t.catalog.stepProgress.replace('{current}', String(stepNumber)).replace('{total}', '3')}</p>
        <h2>{t.catalog.planBoatTrip}</h2>
      </header>
      {step === 'departure' ? <DepartureSelect
        departurePoints={departurePoints}
        selectedDepartureId={selectedDepartureId}
        onDepartureChange={onDepartureChange}
      /> : null}
      {step === 'speed' ? <label className="journey-range">
        <span>
          {t.planning.boatSpeed}
          <strong>{boatSpeedKnots} {t.planning.knotAbbreviation}</strong>
        </span>
        <input
          type="range"
          min="5"
          max="50"
          value={boatSpeedKnots}
          onChange={(event) => onBoatSpeedChange(Number(event.target.value))}
        />
      </label> : null}
      {step === 'distance' ? <label className="journey-range">
        <span>
          {t.planning.maximumBoatDistance}
          <strong>{maximumDistanceNm} NM</strong>
        </span>
        <input
          type="range"
          min="1"
          max="30"
          value={maximumDistanceNm}
          disabled={selectedDepartureId == null}
          onChange={(event) =>
            onMaximumDistanceChange(Number(event.target.value))
          }
        />
      </label> : null}
      <div className="journey-navigation">
        {step !== 'departure' ? <button type="button" onClick={onBack}>{t.catalog.back}</button> : <span />}
        <button
          type="button"
          className="is-primary"
          disabled={step === 'departure' && selectedDepartureId == null}
          onClick={onNext}
        >
          {step === 'speed' ? t.catalog.showResults : t.catalog.next}
        </button>
      </div>
    </section>
  )
}

interface CenterJourneyChoiceProps {
  value: CenterJourney | null
  onChange: (value: CenterJourney) => void
}

export function CenterJourneyChoice({
  value,
  onChange,
}: CenterJourneyChoiceProps) {
  const { t } = useLanguage()

  return (
    <section className="journey-choice">
      <p className="eyebrow">{t.catalog.firstStep}</p>
      <h2>{t.catalog.whatCenterTask}</h2>
      <div>
        <button
          type="button"
          className={value === 'site' ? 'is-active' : ''}
          aria-pressed={value === 'site'}
          onClick={() => onChange('site')}
        >
          <strong>{t.catalog.centerForSite}</strong>
          <span>{t.catalog.centerForSiteHelp}</span>
        </button>
        <button
          type="button"
          className={value === 'browse' ? 'is-active' : ''}
          aria-pressed={value === 'browse'}
          onClick={() => onChange('browse')}
        >
          <strong>{t.catalog.browseCenters}</strong>
          <span>{t.catalog.browseCentersHelp}</span>
        </button>
      </div>
    </section>
  )
}

export function stableSiteOrder(
  sites: readonly DiveSiteFeature[],
): DiveSiteFeature[] {
  return [...sites].sort((a, b) =>
    a.properties.site_name.localeCompare(b.properties.site_name),
  )
}
