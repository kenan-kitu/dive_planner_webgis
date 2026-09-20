import { useCallback, useEffect, useMemo, useState } from 'react'
import { DiverProfile } from './components/Certification/DiverProfile'
import { LanguageSwitcher } from './components/LanguageSwitcher/LanguageSwitcher'
import { DiveMap } from './components/Map/DiveMap'
import { DiveCenterDetails } from './components/Details/DiveCenterDetails'
import { DiveSiteDetails } from './components/Details/DiveSiteDetails'
import { PlanningPanel } from './components/Planning/PlanningPanel'
import { ResultsSummary } from './components/Planning/ResultsSummary'
import { ProjectSidebar } from './components/Sidebar/ProjectSidebar'
import { SidebarSection } from './components/Sidebar/SidebarSection'
import { getCertificationById } from './config/certifications'
import { useLanguage } from './i18n/LanguageContext'
import {
  fetchDeparturePoints,
  fetchDiveCenters,
  fetchDiveSites,
} from './services/geoserver'
import type {
  DeparturePointCollection,
  DiveSiteAnalysis,
  DiveSiteFeature,
  DiveCenterCollection,
  DiveCenterFeature,
  DiveSiteCollection,
} from './types/gis'
import {
  getEffectiveDepthLimit,
  type DiverProfile as DiverProfileValue,
} from './utils/certification'
import { calculateDistanceNm, findNearestPoints } from './utils/spatial'
import {
  getDiveCenterEnrichment,
  getDiveSiteEnrichment,
} from './utils/enrichment'

export type MapLayerKey = 'diveSites' | 'diveCenters' | 'departurePoints'
export type LayerState<T> = Record<MapLayerKey, T>

const INITIAL_LOADING: LayerState<boolean> = {
  diveSites: true,
  diveCenters: true,
  departurePoints: true,
}

const INITIAL_VISIBILITY: LayerState<boolean> = {
  diveSites: true,
  diveCenters: true,
  departurePoints: true,
}

const INITIAL_ERRORS: LayerState<string | null> = {
  diveSites: null,
  diveCenters: null,
  departurePoints: null,
}

const INITIAL_DIVER_PROFILE: DiverProfileValue = {
  agency: 'PADI',
  certificationId: 'padi-open-water',
}

const DEFAULT_MAXIMUM_DISTANCE_NM = 10
const MAXIMUM_DISTANCE_SLIDER_NM = 30
const DEFAULT_BOAT_SPEED_KNOTS = 20

function errorDetails(error: unknown): string {
  return error instanceof Error ? error.message : 'UNKNOWN_ERROR'
}

function App() {
  const { t } = useLanguage()
  const [diveSites, setDiveSites] = useState<DiveSiteCollection | null>(null)
  const [diveCenters, setDiveCenters] =
    useState<DiveCenterCollection | null>(null)
  const [departurePoints, setDeparturePoints] =
    useState<DeparturePointCollection | null>(null)
  const [loading, setLoading] = useState<LayerState<boolean>>(INITIAL_LOADING)
  const [errors, setErrors] =
    useState<LayerState<string | null>>(INITIAL_ERRORS)
  const [visibility, setVisibility] =
    useState<LayerState<boolean>>(INITIAL_VISIBILITY)
  const [requestVersion, setRequestVersion] = useState(0)
  const [diverProfile, setDiverProfile] = useState<DiverProfileValue>(
    INITIAL_DIVER_PROFILE,
  )
  const [selectedDepartureId, setSelectedDepartureId] = useState<number | null>(
    null,
  )
  const [selectedSiteType, setSelectedSiteType] = useState<string | null>(null)
  const [maximumDistanceNm, setMaximumDistanceNm] = useState(
    DEFAULT_MAXIMUM_DISTANCE_NM,
  )
  const [boatSpeedKnots, setBoatSpeedKnots] = useState(
    DEFAULT_BOAT_SPEED_KNOTS,
  )
  const [selectedDiveSite, setSelectedDiveSite] =
    useState<DiveSiteFeature | null>(null)
  const [selectedDiveCenter, setSelectedDiveCenter] =
    useState<DiveCenterFeature | null>(null)
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false)

  const retry = useCallback(() => {
    setRequestVersion((version) => version + 1)
  }, [])

  const toggleLayer = useCallback((layer: MapLayerKey) => {
    setVisibility((current) => ({ ...current, [layer]: !current[layer] }))
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    setLoading(INITIAL_LOADING)
    setErrors(INITIAL_ERRORS)

    const markComplete = (layer: MapLayerKey) => {
      if (!controller.signal.aborted) {
        setLoading((current) => ({ ...current, [layer]: false }))
      }
    }

    const markFailed = (layer: MapLayerKey, error: unknown) => {
      if (!controller.signal.aborted) {
        setErrors((current) => ({
          ...current,
          [layer]: errorDetails(error),
        }))
      }
    }

    void fetchDiveSites(controller.signal)
      .then((data) => setDiveSites(data))
      .catch((error: unknown) => markFailed('diveSites', error))
      .finally(() => markComplete('diveSites'))

    void fetchDiveCenters(controller.signal)
      .then((data) => setDiveCenters(data))
      .catch((error: unknown) => markFailed('diveCenters', error))
      .finally(() => markComplete('diveCenters'))

    void fetchDeparturePoints(controller.signal)
      .then((data) => setDeparturePoints(data))
      .catch((error: unknown) => markFailed('departurePoints', error))
      .finally(() => markComplete('departurePoints'))

    return () => controller.abort()
  }, [requestVersion])

  const isAnythingLoading = Object.values(loading).some(Boolean)
  const effectiveDepthLimit = getEffectiveDepthLimit(diverProfile)
  const selectedCertification = getCertificationById(
    diverProfile.certificationId,
  )
  const selectedDeparture = useMemo(
    () =>
      departurePoints?.features.find(
        (departure) =>
          departure.properties.record_id === selectedDepartureId,
      ) ?? null,
    [departurePoints, selectedDepartureId],
  )
  const siteTypes = useMemo(
    () =>
      Array.from(
        new Set(
          (diveSites?.features ?? [])
            .map((site) => site.properties.site_type)
            .filter((siteType): siteType is string => Boolean(siteType)),
        ),
      ).sort(),
    [diveSites],
  )
  const siteAnalysis = useMemo(() => {
    const analysis = new Map<DiveSiteFeature, DiveSiteAnalysis>()

    for (const site of diveSites?.features ?? []) {
      const maximumDepth = site.properties.max_depth_m
      const matchesDepth =
        effectiveDepthLimit === null ||
        (maximumDepth !== null && maximumDepth <= effectiveDepthLimit)
      const matchesType =
        selectedSiteType === null ||
        site.properties.site_type?.toLowerCase() ===
          selectedSiteType.toLowerCase()
      const distanceNm = selectedDeparture
        ? calculateDistanceNm(selectedDeparture, site)
        : null
      const matchesDistance =
        distanceNm === null || distanceNm <= maximumDistanceNm

      analysis.set(site, {
        distanceNm,
        matchesDepth,
        matchesType,
        matchesDistance,
        isFullMatch: matchesDepth && matchesType && matchesDistance,
      })
    }

    return analysis
  }, [
    diveSites,
    effectiveDepthLimit,
    maximumDistanceNm,
    selectedDeparture,
    selectedSiteType,
  ])
  const resultCounts = useMemo(() => {
    let matching = 0
    let depth = 0
    let distance = 0

    for (const result of siteAnalysis.values()) {
      if (result.isFullMatch) matching += 1
      if (result.matchesDepth) depth += 1
      if (result.matchesDistance) distance += 1
    }

    return { matching, depth, distance }
  }, [siteAnalysis])
  const totalSiteCount = diveSites?.features.length ?? 0
  const nearbyDiveCenters = useMemo(
    () =>
      selectedDiveSite && diveCenters
        ? findNearestPoints(selectedDiveSite, diveCenters.features, 3)
        : [],
    [diveCenters, selectedDiveSite],
  )
  const nearbyDiveCenterIds = useMemo(
    () =>
      new Set(
        nearbyDiveCenters.map(({ feature }) => feature.properties.record_id),
      ),
    [nearbyDiveCenters],
  )
  const selectedSiteEnrichment = selectedDiveSite
    ? getDiveSiteEnrichment(selectedDiveSite.properties.site_name)
    : null
  const selectedCenterEnrichment = selectedDiveCenter
    ? getDiveCenterEnrichment(selectedDiveCenter.properties.record_id)
    : null
  const selectedDiveSiteDistanceNm = selectedDiveSite
    ? (siteAnalysis.get(selectedDiveSite)?.distanceNm ?? null)
    : null
  const selectedSiteTypeLabel = selectedSiteType
    ? (t.dataValues[
        selectedSiteType.toLowerCase() as 'reef' | 'wreck' | 'wall'
      ] ?? selectedSiteType)
    : t.planning.allDiveTypes
  const filterKey = [
    effectiveDepthLimit ?? 'none',
    selectedSiteType ?? 'all',
    selectedDepartureId ?? 'none',
    maximumDistanceNm,
    boatSpeedKnots,
  ].join('-')

  const selectDiveSite = useCallback((site: DiveSiteFeature) => {
    setSelectedDiveSite(site)
    setSelectedDiveCenter(null)
    setIsMobilePanelOpen(true)
  }, [])

  const selectDiveCenter = useCallback((center: DiveCenterFeature) => {
    setSelectedDiveCenter(center)
    setSelectedDiveSite(null)
    setIsMobilePanelOpen(true)
  }, [])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          <span />
        </div>
        <div>
          <p className="topbar__kicker">{t.app.kicker}</p>
          <h1>{t.app.title}</h1>
        </div>
        <div className="topbar__actions">
          <LanguageSwitcher />
          <div className="phase-badge">{t.app.phase}</div>
        </div>
      </header>

      <main className="workspace">
        <aside
          className={`sidebar${isMobilePanelOpen ? ' is-mobile-open' : ''}`}
          id="planning-panel"
          aria-label={t.planning.planning}
        >
          <div className="mobile-panel-header">
            <div>
              <small>{t.planning.results}</small>
              <strong>
                {resultCounts.matching} {t.planning.matchingDiveSites}
              </strong>
            </div>
            <button
              type="button"
              aria-label={t.planning.closeFilters}
              onClick={() => setIsMobilePanelOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="mobile-sheet__content">
            <div className="desktop-sidebar-heading">
              <p className="eyebrow">{t.planning.planning}</p>
              <h2>{t.app.shortTitle}</h2>
            </div>

            <dl className="mobile-selection-summary">
              <div>
                <dt>{t.planning.certification}</dt>
                <dd>{`${diverProfile.agency} ${selectedCertification?.name ?? ''}`}</dd>
              </div>
              <div>
                <dt>{t.planning.diveType}</dt>
                <dd>{selectedSiteTypeLabel}</dd>
              </div>
              <div>
                <dt>{t.planning.departurePoint}</dt>
                <dd>
                  {selectedDeparture?.properties.name ??
                    t.planning.noDepartureSelected}
                </dd>
              </div>
              <div>
                <dt>{t.planning.maximumBoatDistance}</dt>
                <dd>{maximumDistanceNm} NM</dd>
              </div>
              <div>
                <dt>{t.planning.boatSpeed}</dt>
                <dd>
                  {boatSpeedKnots} {t.planning.knotAbbreviation}
                </dd>
              </div>
            </dl>

            <SidebarSection
              title={t.planning.certification}
              summary={`${diverProfile.agency} · ${selectedCertification?.name ?? ''}`}
            >
              <DiverProfile
                profile={diverProfile}
                effectiveDepthLimit={effectiveDepthLimit}
                matchingSiteCount={resultCounts.matching}
                totalSiteCount={totalSiteCount}
                onChange={setDiverProfile}
              />
            </SidebarSection>

            <SidebarSection
              title={t.planning.divePlanning}
              summary={`${selectedSiteTypeLabel} · ${selectedDeparture?.properties.name ?? t.planning.noDepartureSelected} · ${maximumDistanceNm} NM · ${boatSpeedKnots} ${t.planning.knotAbbreviation}`}
              initiallyOpen
            >
              <PlanningPanel
                departurePoints={departurePoints}
                siteTypes={siteTypes}
                selectedDepartureId={selectedDepartureId}
                selectedSiteType={selectedSiteType}
                maximumDistanceNm={maximumDistanceNm}
                maximumSliderDistanceNm={MAXIMUM_DISTANCE_SLIDER_NM}
                boatSpeedKnots={boatSpeedKnots}
                selectedDiveSiteName={
                  selectedDiveSite?.properties.site_name ?? null
                }
                selectedDiveSiteDistanceNm={selectedDiveSiteDistanceNm}
                onDepartureChange={setSelectedDepartureId}
                onSiteTypeChange={setSelectedSiteType}
                onMaximumDistanceChange={setMaximumDistanceNm}
                onBoatSpeedChange={setBoatSpeedKnots}
              />
            </SidebarSection>

            {selectedDiveSite && (
              <DiveSiteDetails
                site={selectedDiveSite}
                enrichment={selectedSiteEnrichment}
                selectedDeparture={selectedDeparture}
                directDistanceNm={selectedDiveSiteDistanceNm}
                boatSpeedKnots={boatSpeedKnots}
                nearbyCenters={nearbyDiveCenters}
              />
            )}

            {selectedDiveCenter && (
              <DiveCenterDetails
                center={selectedDiveCenter}
                enrichment={selectedCenterEnrichment}
              />
            )}

            <ResultsSummary
              totalSiteCount={totalSiteCount}
              matchingSiteCount={resultCounts.matching}
              depthMatchCount={resultCounts.depth}
              distanceMatchCount={
                selectedDeparture ? resultCounts.distance : null
              }
              selectedDepartureName={
                selectedDeparture?.properties.name ?? null
              }
            />

            <SidebarSection
              title={t.planning.mapLayers}
              summary={`${diveSites?.features.length ?? 0} · ${diveCenters?.features.length ?? 0} · ${departurePoints?.features.length ?? 0}`}
            >
              <ProjectSidebar
                counts={{
                  diveSites: totalSiteCount,
                  diveCenters: diveCenters?.features.length ?? 0,
                  departurePoints: departurePoints?.features.length ?? 0,
                }}
                loading={loading}
                errors={errors}
                visibility={visibility}
                onToggleLayer={toggleLayer}
                onRetry={retry}
              />
            </SidebarSection>
          </div>
        </aside>
        {isMobilePanelOpen && (
          <button
            className="mobile-sheet-backdrop"
            type="button"
            aria-label={t.planning.closeFilters}
            onClick={() => setIsMobilePanelOpen(false)}
          />
        )}
        <section className="map-panel" aria-label={t.app.mapAriaLabel}>
          <DiveMap
            diveSites={diveSites}
            diveCenters={diveCenters}
            departurePoints={departurePoints}
            visibility={visibility}
            siteAnalysis={siteAnalysis}
            analysisKey={filterKey}
            selectedDeparture={selectedDeparture}
            selectedDiveSite={selectedDiveSite}
            selectedDiveCenter={selectedDiveCenter}
            nearbyDiveCenterIds={nearbyDiveCenterIds}
            maximumDistanceNm={maximumDistanceNm}
            boatSpeedKnots={boatSpeedKnots}
            onSelectDeparture={setSelectedDepartureId}
            onSelectDiveSite={selectDiveSite}
            onSelectDiveCenter={selectDiveCenter}
          />
          {isAnythingLoading && (
            <div className="map-message">{t.status.loadingMapLayers}</div>
          )}
        </section>
        <button
          className="mobile-filter-toggle"
          type="button"
          aria-controls="planning-panel"
          aria-expanded={isMobilePanelOpen}
          onClick={() => setIsMobilePanelOpen(true)}
        >
          <span>{t.planning.openFilters}</span>
          <strong>{resultCounts.matching}</strong>
        </button>
      </main>

      <footer>
        <span>{t.disclaimer}</span>
        <strong>{t.credit}</strong>
      </footer>
    </div>
  )
}

export default App
