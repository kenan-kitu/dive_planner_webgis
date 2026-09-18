import { useCallback, useEffect, useState } from 'react'
import { DiverProfile } from './components/Certification/DiverProfile'
import { LanguageSwitcher } from './components/LanguageSwitcher/LanguageSwitcher'
import { DiveMap } from './components/Map/DiveMap'
import { ProjectSidebar } from './components/Sidebar/ProjectSidebar'
import { useLanguage } from './i18n/LanguageContext'
import {
  fetchDeparturePoints,
  fetchDiveCenters,
  fetchDiveSites,
} from './services/geoserver'
import type {
  DeparturePointCollection,
  DiveCenterCollection,
  DiveSiteCollection,
} from './types/gis'
import {
  getEffectiveDepthLimit,
  type DiverProfile as DiverProfileValue,
} from './utils/certification'

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
  const matchingSiteCount =
    diveSites?.features.filter((site) => {
      if (effectiveDepthLimit === null) return true
      const maximumDepth = site.properties.max_depth_m
      return maximumDepth !== null && maximumDepth <= effectiveDepthLimit
    }).length ?? 0

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
        <aside className="sidebar">
          <DiverProfile
            profile={diverProfile}
            effectiveDepthLimit={effectiveDepthLimit}
            matchingSiteCount={matchingSiteCount}
            totalSiteCount={diveSites?.features.length ?? 0}
            onChange={setDiverProfile}
          />
          <ProjectSidebar
            counts={{
              diveSites: diveSites?.features.length ?? 0,
              diveCenters: diveCenters?.features.length ?? 0,
              departurePoints: departurePoints?.features.length ?? 0,
            }}
            loading={loading}
            errors={errors}
            visibility={visibility}
            onToggleLayer={toggleLayer}
            onRetry={retry}
          />
        </aside>
        <section className="map-panel" aria-label={t.app.mapAriaLabel}>
          <DiveMap
            diveSites={diveSites}
            diveCenters={diveCenters}
            departurePoints={departurePoints}
            visibility={visibility}
            effectiveDepthLimit={effectiveDepthLimit}
          />
          {isAnythingLoading && (
            <div className="map-message">{t.status.loadingMapLayers}</div>
          )}
        </section>
      </main>

      <footer>{t.disclaimer}</footer>
    </div>
  )
}

export default App
