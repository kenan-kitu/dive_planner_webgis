import { useDeferredValue, useMemo, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import type {
  DeparturePointCollection,
  DeparturePointFeature,
} from '../../types/gis'

interface PlanningPanelProps {
  departurePoints: DeparturePointCollection | null
  siteTypes: string[]
  selectedDepartureId: number | null
  selectedSiteType: string | null
  maximumDistanceNm: number
  maximumSliderDistanceNm: number
  onDepartureChange: (recordId: number | null) => void
  onSiteTypeChange: (siteType: string | null) => void
  onMaximumDistanceChange: (distanceNm: number) => void
}

const GENERIC_DEPARTURE_NAME = /^(boat ramp|boat launch|marina|dock|pier|unnamed)/i

function isNamedDeparture(feature: DeparturePointFeature): boolean {
  return !GENERIC_DEPARTURE_NAME.test(feature.properties.name.trim())
}

function sortDepartures(
  departures: DeparturePointFeature[],
): DeparturePointFeature[] {
  return [...departures].sort((first, second) => {
    const namedDifference =
      Number(isNamedDeparture(second)) - Number(isNamedDeparture(first))
    return (
      namedDifference ||
      first.properties.name.localeCompare(second.properties.name)
    )
  })
}

export function PlanningPanel({
  departurePoints,
  siteTypes,
  selectedDepartureId,
  selectedSiteType,
  maximumDistanceNm,
  maximumSliderDistanceNm,
  onDepartureChange,
  onSiteTypeChange,
  onMaximumDistanceChange,
}: PlanningPanelProps) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase())

  const groupedDepartures = useMemo(() => {
    const allDepartures = departurePoints?.features ?? []
    const filtered = allDepartures.filter((departure) => {
      if (!deferredSearch) return true
      const searchable = [
        departure.properties.name,
        departure.properties.type,
        departure.properties.operator,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
      return (
        departure.properties.record_id === selectedDepartureId ||
        searchable.includes(deferredSearch)
      )
    })

    return {
      marinas: sortDepartures(
        filtered.filter(
          (departure) =>
            departure.properties.type?.trim().toLowerCase() === 'marina',
        ),
      ),
      boatRamps: sortDepartures(
        filtered.filter(
          (departure) =>
            departure.properties.type?.trim().toLowerCase() === 'boat ramp',
        ),
      ),
    }
  }, [departurePoints, deferredSearch, selectedDepartureId])

  const hasSearchResults =
    groupedDepartures.marinas.length + groupedDepartures.boatRamps.length > 0
  const selectedDepartureName = departurePoints?.features.find(
    (departure) => departure.properties.record_id === selectedDepartureId,
  )?.properties.name

  return (
    <section className="planning-panel" aria-labelledby="planning-panel-title">
      <header>
        <p className="eyebrow">{t.planning.routeFilters}</p>
        <h2 id="planning-panel-title">{t.planning.divePlanning}</h2>
      </header>

      <label className="planning-field">
        <span>{t.planning.diveType}</span>
        <select
          value={selectedSiteType ?? ''}
          onChange={(event) =>
            onSiteTypeChange(event.target.value || null)
          }
        >
          <option value="">{t.planning.allDiveTypes}</option>
          {siteTypes.map((siteType) => (
            <option key={siteType} value={siteType}>
              {t.dataValues[siteType.toLowerCase() as 'reef' | 'wreck' | 'wall'] ?? siteType}
            </option>
          ))}
        </select>
      </label>

      <div className="departure-picker">
        <label className="planning-field">
          <span>{t.planning.searchDeparture}</span>
          <input
            type="search"
            value={search}
            placeholder={t.planning.searchDeparturePlaceholder}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <label className="planning-field">
          <span>{t.planning.departurePoint}</span>
          <select
            value={selectedDepartureId ?? ''}
            title={selectedDepartureName}
            onChange={(event) =>
              onDepartureChange(
                event.target.value ? Number(event.target.value) : null,
              )
            }
          >
            <option value="">{t.planning.selectDeparture}</option>
            {groupedDepartures.marinas.length > 0 && (
              <optgroup label={t.planning.marina}>
                {groupedDepartures.marinas.map((departure) => (
                  <option
                    key={departure.properties.record_id}
                    value={departure.properties.record_id}
                  >
                    {departure.properties.name}
                  </option>
                ))}
              </optgroup>
            )}
            {groupedDepartures.boatRamps.length > 0 && (
              <optgroup label={t.planning.boatRamp}>
                {groupedDepartures.boatRamps.map((departure) => (
                  <option
                    key={departure.properties.record_id}
                    value={departure.properties.record_id}
                  >
                    {departure.properties.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {selectedDepartureName && (
            <output className="selected-departure" aria-live="polite">
              <small>{t.planning.departurePoint}</small>
              <strong>{selectedDepartureName}</strong>
            </output>
          )}
          <small>
            {hasSearchResults
              ? t.planning.namedDeparturesFirst
              : t.planning.noDepartureMatches}
          </small>
        </label>
      </div>

      <label className="distance-control">
        <span>
          {t.planning.maximumBoatDistance}
          <strong>{maximumDistanceNm} NM</strong>
        </span>
        <input
          type="range"
          min="1"
          max={maximumSliderDistanceNm}
          step="1"
          value={maximumDistanceNm}
          disabled={selectedDepartureId === null}
          onChange={(event) =>
            onMaximumDistanceChange(Number(event.target.value))
          }
        />
        <small>
          {selectedDepartureId === null
            ? t.planning.selectDepartureForDistance
            : `1–${maximumSliderDistanceNm} ${t.planning.nauticalMiles}`}
        </small>
      </label>
    </section>
  )
}
