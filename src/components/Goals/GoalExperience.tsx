import { useMemo } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher'
import type {
  DiveCenterCollection,
  DiveCenterFeature,
  DiveSiteCollection,
  DiveSiteFeature,
} from '../../types/gis'

export type UserGoal =
  | 'findSites'
  | 'exploreSite'
  | 'boatTrip'
  | 'findCenter'

interface OpeningExperienceProps {
  onSelect: (goal: UserGoal) => void
  onReturnToMap: () => void
}

const GOAL_ORDER: UserGoal[] = [
  'findSites',
  'exploreSite',
  'boatTrip',
  'findCenter',
]

const GOAL_ICONS: Record<UserGoal, string> = {
  findSites: '◎',
  exploreSite: '⌖',
  boatTrip: '→',
  findCenter: '+',
}

export function OpeningExperience({
  onSelect,
  onReturnToMap,
}: OpeningExperienceProps) {
  const { t } = useLanguage()

  return (
    <section
      className="opening-experience"
      role="dialog"
      aria-modal="true"
      aria-labelledby="opening-experience-title"
    >
      <div className="opening-experience__panel">
        <div className="opening-experience__language">
          <LanguageSwitcher />
        </div>
        <header>
          <p className="eyebrow">{t.goals.eyebrow}</p>
          <h2 id="opening-experience-title">{t.goals.question}</h2>
          <p>{t.goals.intro}</p>
        </header>

        <div className="goal-grid">
          {GOAL_ORDER.map((goal, index) => (
            <button
              className="goal-option"
              type="button"
              key={goal}
              onClick={() => onSelect(goal)}
            >
              <span className="goal-option__icon" aria-hidden="true">
                {GOAL_ICONS[goal]}
              </span>
              <span className="goal-option__copy">
                <small>
                  {t.goals.step} {index + 1}
                </small>
                <strong>{t.goals.options[goal].title}</strong>
                <span>{t.goals.options[goal].description}</span>
              </span>
              <span className="goal-option__arrow" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>

        <button
          className="opening-experience__map-button"
          type="button"
          onClick={onReturnToMap}
        >
          {t.goals.returnToMap}
        </button>
      </div>
    </section>
  )
}

interface GoalHeaderProps {
  goal: UserGoal
  onChangeGoal: () => void
  onShowFullControls: () => void
  onReturnToMap: () => void
}

export function GoalHeader({
  goal,
  onChangeGoal,
  onShowFullControls,
  onReturnToMap,
}: GoalHeaderProps) {
  const { t } = useLanguage()

  return (
    <section className="goal-context" aria-labelledby="active-goal-title">
      <div className="goal-context__heading">
        <span className="goal-option__icon" aria-hidden="true">
          {GOAL_ICONS[goal]}
        </span>
        <div>
          <small>{t.goals.currentGoal}</small>
          <h2 id="active-goal-title">{t.goals.options[goal].title}</h2>
        </div>
      </div>
      <p>{t.goals.options[goal].description}</p>
      <div className="goal-context__actions">
        <button type="button" onClick={onChangeGoal}>
          {t.goals.changeGoal}
        </button>
        <button type="button" onClick={onShowFullControls}>
          {t.goals.fullControls}
        </button>
        <button type="button" onClick={onReturnToMap}>
          {t.goals.returnToMap}
        </button>
      </div>
    </section>
  )
}

interface GoalSelectorProps {
  goal: 'exploreSite' | 'findCenter'
  diveSites: DiveSiteCollection | null
  diveCenters: DiveCenterCollection | null
  selectedDiveSite: DiveSiteFeature | null
  selectedDiveCenter: DiveCenterFeature | null
  onSelectDiveSite: (site: DiveSiteFeature) => void
  onSelectDiveCenter: (center: DiveCenterFeature) => void
}

export function GoalSelector({
  goal,
  diveSites,
  diveCenters,
  selectedDiveSite,
  selectedDiveCenter,
  onSelectDiveSite,
  onSelectDiveCenter,
}: GoalSelectorProps) {
  const { t } = useLanguage()
  const sites = useMemo(
    () =>
      [...(diveSites?.features ?? [])].sort((first, second) =>
        first.properties.site_name.localeCompare(second.properties.site_name),
      ),
    [diveSites],
  )
  const centers = useMemo(
    () =>
      [...(diveCenters?.features ?? [])].sort((first, second) =>
        first.properties.name.localeCompare(second.properties.name),
      ),
    [diveCenters],
  )

  const sitePicker = (
    <label className="goal-selector__field">
      <span>{t.goals.selectDiveSite}</span>
      <select
        value={selectedDiveSite?.properties.site_name ?? ''}
        onChange={(event) => {
          const site = sites.find(
            (candidate) => candidate.properties.site_name === event.target.value,
          )
          if (site) onSelectDiveSite(site)
        }}
      >
        <option value="">{t.goals.chooseDiveSite}</option>
        {sites.map((site) => (
          <option
            key={site.properties.site_name}
            value={site.properties.site_name}
          >
            {site.properties.site_name}
          </option>
        ))}
      </select>
    </label>
  )

  if (goal === 'exploreSite') {
    return (
      <section className="goal-selector">
        <small>{t.goals.firstStep}</small>
        <h3>{t.goals.pickSiteHeading}</h3>
        <p>{t.goals.pickSiteHelp}</p>
        {sitePicker}
      </section>
    )
  }

  return (
    <section className="goal-selector">
      <small>{t.goals.firstStep}</small>
      <h3>{t.goals.findCenterHeading}</h3>
      <p>{t.goals.findCenterHelp}</p>
      <div className="goal-selector__choices">
        <div>
          <strong>{t.goals.byDiveSite}</strong>
          {sitePicker}
        </div>
        <span className="goal-selector__or">{t.goals.or}</span>
        <label className="goal-selector__field">
          <span>{t.goals.byDiveCenter}</span>
          <select
            value={selectedDiveCenter?.properties.record_id ?? ''}
            onChange={(event) => {
              const center = centers.find(
                (candidate) =>
                  candidate.properties.record_id === Number(event.target.value),
              )
              if (center) onSelectDiveCenter(center)
            }}
          >
            <option value="">{t.goals.chooseDiveCenter}</option>
            {centers.map((center) => (
              <option
                key={center.properties.record_id}
                value={center.properties.record_id}
              >
                {center.properties.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
