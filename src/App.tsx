import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DiverProfile } from './components/Certification/DiverProfile'
import { LanguageSwitcher } from './components/LanguageSwitcher/LanguageSwitcher'
import { DiveMap } from './components/Map/DiveMap'
import { DiveCenterDetails } from './components/Details/DiveCenterDetails'
import { DiveSiteDetails } from './components/Details/DiveSiteDetails'
import { DiveSiteCatalog } from './components/Catalog/DiveSiteCatalog'
import {
  DiveCenterCatalog,
  type CenterCatalogItem,
} from './components/Catalog/DiveCenterCatalog'
import {
  GoalHeader,
  OpeningExperience,
  type UserGoal,
} from './components/Goals/GoalExperience'
import {
  BoatTripQuestions,
  CenterJourneyChoice,
  SiteMatchQuestions,
  stableSiteOrder,
  type BoatTripStep,
  type CenterJourney,
  type SiteMatchStep,
  type TravelPreference,
} from './components/Goals/GoalQuestions'
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
  DiveSiteFeature,
  DiveCenterCollection,
  DiveCenterFeature,
  DiveSiteCollection,
} from './types/gis'
import {
  getEffectiveDepthLimit,
  type DiverProfile as DiverProfileValue,
} from './utils/certification'
import { findNearestPoints } from './utils/spatial'
import {
  createDiveSiteAnalysis,
  filterDiveSitesForJourney,
} from './utils/siteFiltering'
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
const SESSION_GOAL_KEY = 'dive-planner-user-goal'
const USER_GOALS: UserGoal[] = [
  'findSites',
  'exploreSite',
  'boatTrip',
  'findCenter',
]

function readSessionGoal(): UserGoal | null {
  const storedGoal = window.sessionStorage.getItem(SESSION_GOAL_KEY)
  return USER_GOALS.includes(storedGoal as UserGoal)
    ? (storedGoal as UserGoal)
    : null
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
  const [userGoal, setUserGoal] = useState<UserGoal | null>(readSessionGoal)
  const [isOpeningExperienceOpen, setIsOpeningExperienceOpen] = useState(
    userGoal === null,
  )
  const [showFullControls, setShowFullControls] = useState(false)
  const [travelPreference, setTravelPreference] =
    useState<TravelPreference>('none')
  const [centerJourney, setCenterJourney] = useState<CenterJourney | null>(null)
  const [siteCatalogSearch, setSiteCatalogSearch] = useState('')
  const [siteCatalogType, setSiteCatalogType] = useState<string | null>(null)
  const [centerCatalogSearch, setCenterCatalogSearch] = useState('')
  const [catalogView, setCatalogView] = useState<'list' | 'map'>('list')
  const [showOtherDiveSites, setShowOtherDiveSites] = useState(false)
  const [siteMatchStep, setSiteMatchStep] =
    useState<SiteMatchStep>('certification')
  const [boatTripStep, setBoatTripStep] =
    useState<BoatTripStep>('departure')
  const [isNearbyCenterJourneyOpen, setIsNearbyCenterJourneyOpen] =
    useState(false)
  const [isDesktopDetailPanelOpen, setIsDesktopDetailPanelOpen] = useState(true)
  const [isDesktopLayout, setIsDesktopLayout] = useState(() =>
    window.matchMedia('(min-width: 1000px)').matches,
  )

  const retry = useCallback(() => {
    setRequestVersion((version) => version + 1)
  }, [])

  const toggleLayer = useCallback((layer: MapLayerKey) => {
    setVisibility((current) => ({ ...current, [layer]: !current[layer] }))
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1000px)')
    const syncLayout = () => setIsDesktopLayout(media.matches)
    media.addEventListener('change', syncLayout)
    return () => media.removeEventListener('change', syncLayout)
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
    return createDiveSiteAnalysis(
      diveSites?.features ?? [],
      effectiveDepthLimit,
      selectedSiteType,
      selectedDeparture,
      maximumDistanceNm,
    )
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
  const nearbyDepartureOptions = useMemo(
    () =>
      selectedDiveSite && departurePoints
        ? findNearestPoints(selectedDiveSite, departurePoints.features, 3)
        : [],
    [departurePoints, selectedDiveSite],
  )
  const nearbySitesForCenter = useMemo(
    () =>
      selectedDiveCenter && diveSites
        ? findNearestPoints(selectedDiveCenter, diveSites.features, 5)
        : [],
    [diveSites, selectedDiveCenter],
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
  const findSiteResults = useMemo(() => {
    const sites = filterDiveSitesForJourney(
      diveSites?.features ?? [],
      siteAnalysis,
      travelPreference,
      selectedDeparture !== null,
    )

    return [...sites].sort((first, second) => {
      if (selectedDeparture) {
        return (
          (siteAnalysis.get(first)?.distanceNm ?? Number.POSITIVE_INFINITY) -
          (siteAnalysis.get(second)?.distanceNm ?? Number.POSITIVE_INFINITY)
        )
      }
      return first.properties.site_name.localeCompare(second.properties.site_name)
    })
  }, [
    diveSites,
    selectedDeparture,
    siteAnalysis,
    travelPreference,
  ])
  const exploredSites = useMemo(() => {
    const normalizedSearch = siteCatalogSearch.trim().toLocaleLowerCase()
    return stableSiteOrder(diveSites?.features ?? []).filter((site) => {
      const type = site.properties.site_type?.toLocaleLowerCase()
      const matchesSearch =
        !normalizedSearch ||
        site.properties.site_name.toLocaleLowerCase().includes(normalizedSearch)
      const matchesType = !siteCatalogType || type === siteCatalogType
      return matchesSearch && matchesType
    })
  }, [diveSites, siteCatalogSearch, siteCatalogType])
  const reachableSites = useMemo(() => {
    if (!selectedDeparture) return []
    return [...(diveSites?.features ?? [])]
      .filter((site) => siteAnalysis.get(site)?.matchesDistance)
      .sort(
        (first, second) =>
          (siteAnalysis.get(first)?.distanceNm ?? Number.POSITIVE_INFINITY) -
          (siteAnalysis.get(second)?.distanceNm ?? Number.POSITIVE_INFINITY),
      )
  }, [diveSites, selectedDeparture, siteAnalysis])
  const nearbyCenterCatalog: CenterCatalogItem[] = useMemo(
    () =>
      nearbyDiveCenters.map(({ feature, distanceNm }) => ({
        center: feature,
        distanceNm,
      })),
    [nearbyDiveCenters],
  )
  const allCenterCatalog: CenterCatalogItem[] = useMemo(() => {
    const normalizedSearch = centerCatalogSearch.trim().toLocaleLowerCase()
    return [...(diveCenters?.features ?? [])]
      .filter((center) =>
        center.properties.name.toLocaleLowerCase().includes(normalizedSearch),
      )
      .sort((first, second) =>
        first.properties.name.localeCompare(second.properties.name),
      )
      .map((center) => ({ center }))
  }, [centerCatalogSearch, diveCenters])
  const activeCatalogSites = useMemo(() => {
    if (showFullControls) {
      return (diveSites?.features ?? []).filter(
        (site) => siteAnalysis.get(site)?.isFullMatch,
      )
    }
    if (userGoal === 'findSites') {
      return siteMatchStep === 'results' ? findSiteResults : []
    }
    if (userGoal === 'exploreSite') return exploredSites
    if (userGoal === 'boatTrip') {
      return boatTripStep === 'results' ? reachableSites : []
    }
    if (userGoal === 'findCenter' && centerJourney === 'site') {
      return exploredSites
    }
    return diveSites?.features ?? []
  }, [
    centerJourney,
    diveSites,
    exploredSites,
    findSiteResults,
    reachableSites,
    boatTripStep,
    showFullControls,
    siteAnalysis,
    siteMatchStep,
    userGoal,
  ])
  const activeCatalogSiteNames = useMemo(
    () => new Set(activeCatalogSites.map((site) => site.properties.site_name)),
    [activeCatalogSites],
  )
  const activeCatalogCenterIds = useMemo(() => {
    if (isNearbyCenterJourneyOpen) return nearbyDiveCenterIds
    if (userGoal !== 'findCenter' || showFullControls) {
      return new Set((diveCenters?.features ?? []).map((center) => center.properties.record_id))
    }
    const items = centerJourney === 'site' ? nearbyCenterCatalog : allCenterCatalog
    return new Set(items.map(({ center }) => center.properties.record_id))
  }, [
    allCenterCatalog,
    centerJourney,
    diveCenters,
    isNearbyCenterJourneyOpen,
    nearbyCenterCatalog,
    nearbyDiveCenterIds,
    showFullControls,
    userGoal,
  ])
  const activeCatalogKey = useMemo(
    () => activeCatalogSites.map((site) => site.properties.site_name).join('|'),
    [activeCatalogSites],
  )
  const filterKey = [
    effectiveDepthLimit ?? 'none',
    selectedSiteType ?? 'all',
    selectedDepartureId ?? 'none',
    maximumDistanceNm,
    boatSpeedKnots,
    activeCatalogKey,
    userGoal ?? 'none',
  ].join('-')
  const isFocusedSiteResultMode =
    !showFullControls &&
    ((userGoal === 'findSites' && siteMatchStep === 'results') ||
      userGoal === 'exploreSite' ||
      (userGoal === 'boatTrip' && boatTripStep === 'results') ||
      (userGoal === 'findCenter' && centerJourney === 'site'))
  const canShowOtherDiveSites =
    isFocusedSiteResultMode && activeCatalogSites.length < totalSiteCount

  useEffect(() => {
    setShowOtherDiveSites(false)
  }, [activeCatalogKey, userGoal])

  useEffect(() => {
    if (
      isFocusedSiteResultMode &&
      selectedDiveSite &&
      !activeCatalogSiteNames.has(selectedDiveSite.properties.site_name)
    ) {
      setSelectedDiveSite(null)
      setSelectedDiveCenter(null)
      setIsNearbyCenterJourneyOpen(false)
    }
  }, [activeCatalogSiteNames, isFocusedSiteResultMode, selectedDiveSite])

  const selectDiveSite = useCallback((site: DiveSiteFeature) => {
    setSelectedDiveSite(site)
    setSelectedDiveCenter(null)
    setIsNearbyCenterJourneyOpen(false)
    setCatalogView('list')
    setIsMobilePanelOpen(true)
    setIsDesktopDetailPanelOpen(true)
  }, [])

  const selectDiveCenter = useCallback((center: DiveCenterFeature) => {
    setSelectedDiveCenter(center)
    setCatalogView('list')
    setIsMobilePanelOpen(true)
    setIsDesktopDetailPanelOpen(true)
  }, [])

  const selectGoal = useCallback((goal: UserGoal) => {
    window.sessionStorage.setItem(SESSION_GOAL_KEY, goal)
    setUserGoal(goal)
    setShowFullControls(false)
    setSelectedDiveSite(null)
    setSelectedDiveCenter(null)
    setIsNearbyCenterJourneyOpen(false)
    setSelectedDepartureId(null)
    setSelectedSiteType(null)
    setTravelPreference('none')
    setCenterJourney(null)
    setSiteCatalogSearch('')
    setSiteCatalogType(null)
    setCenterCatalogSearch('')
    setShowOtherDiveSites(false)
    setCatalogView('list')
    setSiteMatchStep('certification')
    setBoatTripStep('departure')
    setIsOpeningExperienceOpen(false)
    setIsMobilePanelOpen(true)
  }, [])

  const nextSiteMatchStep = useCallback(() => {
    setSiteMatchStep((current) => {
      if (current === 'certification') return 'type'
      if (current === 'type') return 'travel'
      return 'results'
    })
  }, [])

  const previousSiteMatchStep = useCallback(() => {
    setSiteMatchStep((current) => {
      if (current === 'results') return 'travel'
      if (current === 'travel') return 'type'
      return 'certification'
    })
  }, [])

  const nextBoatTripStep = useCallback(() => {
    setBoatTripStep((current) => {
      if (current === 'departure') return 'distance'
      if (current === 'distance') return 'speed'
      return 'results'
    })
  }, [])

  const previousBoatTripStep = useCallback(() => {
    setBoatTripStep((current) => {
      if (current === 'results') return 'speed'
      if (current === 'speed') return 'distance'
      return 'departure'
    })
  }, [])

  const changeGoal = useCallback(() => {
    window.sessionStorage.removeItem(SESSION_GOAL_KEY)
    setUserGoal(null)
    setShowFullControls(false)
    setSelectedDiveSite(null)
    setSelectedDiveCenter(null)
    setIsNearbyCenterJourneyOpen(false)
    setSelectedDepartureId(null)
    setSelectedSiteType(null)
    setTravelPreference('none')
    setCenterJourney(null)
    setIsOpeningExperienceOpen(true)
    setIsMobilePanelOpen(false)
  }, [])

  const returnToMap = useCallback(() => {
    setIsOpeningExperienceOpen(false)
    setIsMobilePanelOpen(false)
  }, [])

  const openFullControls = useCallback(() => {
    setShowFullControls(true)
    setIsMobilePanelOpen(true)
  }, [])

  const selectTravelPreference = useCallback((preference: TravelPreference) => {
    setTravelPreference(preference)
    if (preference === 'none') setSelectedDepartureId(null)
    if (preference === 'short') setMaximumDistanceNm(5)
  }, [])

  const selectCenterJourney = useCallback((journey: CenterJourney) => {
    setCenterJourney(journey)
    setSelectedDiveSite(null)
    setSelectedDiveCenter(null)
    setIsNearbyCenterJourneyOpen(false)
    setSiteCatalogSearch('')
    setCenterCatalogSearch('')
  }, [])

  const clearDetail = useCallback(() => {
    setSelectedDiveSite(null)
    setSelectedDiveCenter(null)
    setIsNearbyCenterJourneyOpen(false)
    setIsDesktopDetailPanelOpen(false)
  }, [])

  const openNearbyCenterJourney = useCallback(() => {
    setSelectedDiveCenter(null)
    setIsNearbyCenterJourneyOpen(true)
    setCatalogView('list')
    setIsMobilePanelOpen(true)
  }, [])

  const backToDiveSiteDetail = useCallback(() => {
    setSelectedDiveCenter(null)
    setIsNearbyCenterJourneyOpen(false)
  }, [])

  const backToNearbyCenterCatalog = useCallback(() => {
    setSelectedDiveCenter(null)
  }, [])

  const toggleDiveSiteFromMap = useCallback(
    (site: DiveSiteFeature) => {
      if (selectedDiveSite?.properties.site_name === site.properties.site_name) {
        if (isDesktopLayout && !isDesktopDetailPanelOpen) {
          setIsDesktopDetailPanelOpen(true)
          return
        }
        clearDetail()
        return
      }
      selectDiveSite(site)
    },
    [clearDetail, isDesktopDetailPanelOpen, isDesktopLayout, selectDiveSite, selectedDiveSite],
  )

  const toggleDiveCenterFromMap = useCallback(
    (center: DiveCenterFeature) => {
      if (
        selectedDiveCenter?.properties.record_id === center.properties.record_id
      ) {
        setSelectedDiveCenter(null)
        return
      }
      selectDiveCenter(center)
    },
    [selectDiveCenter, selectedDiveCenter],
  )

  const toggleDepartureFromMap = useCallback((recordId: number) => {
    setSelectedDepartureId((current) => (current === recordId ? null : recordId))
  }, [])

  const showCatalogMap = useCallback(() => {
    setCatalogView('map')
    setIsMobilePanelOpen(false)
  }, [])

  const showCatalogList = useCallback(() => {
    setCatalogView('list')
    setIsMobilePanelOpen(true)
  }, [])

  const planBoatTripForSelectedSite = useCallback(() => {
    window.sessionStorage.setItem(SESSION_GOAL_KEY, 'boatTrip')
    setUserGoal('boatTrip')
    setShowFullControls(false)
    setBoatTripStep('departure')
    setSelectedDepartureId(null)
    setSelectedDiveSite(null)
    setSelectedDiveCenter(null)
    setIsNearbyCenterJourneyOpen(false)
    setCatalogView('list')
    setIsMobilePanelOpen(true)
  }, [])

  const showSelectedSiteOnMap = useCallback(() => {
    setCatalogView('map')
    setIsMobilePanelOpen(false)
    setIsDesktopDetailPanelOpen(false)
  }, [])

  const isFullPlanningView = showFullControls
  const isJourneyResultsVisible =
    showFullControls ||
    userGoal === 'exploreSite' ||
    (userGoal === 'findSites' && siteMatchStep === 'results') ||
    (userGoal === 'boatTrip' && boatTripStep === 'results') ||
    (userGoal === 'findCenter' && centerJourney !== null)
  const contextualVisibility: LayerState<boolean> = showFullControls
    ? visibility
    : {
        diveSites:
          isJourneyResultsVisible &&
          (userGoal !== 'findCenter' || centerJourney === 'site'),
        diveCenters:
          isJourneyResultsVisible &&
          (userGoal === 'findCenter' || isNearbyCenterJourneyOpen),
        departurePoints: userGoal === 'boatTrip' && boatTripStep === 'results',
      }
  const showTripAnalysis =
    showFullControls || (userGoal === 'boatTrip' && boatTripStep === 'results')
  const contextualDiveCenters = useMemo<DiveCenterCollection | null>(() => {
    if (!diveCenters || showFullControls) return diveCenters
    if (isNearbyCenterJourneyOpen || (userGoal === 'findCenter' && centerJourney === 'site' && selectedDiveSite)) {
      return {
        ...diveCenters,
        features: diveCenters.features.filter((center) =>
          nearbyDiveCenterIds.has(center.properties.record_id),
        ),
      }
    }
    return userGoal === 'findCenter' && centerJourney === 'browse'
      ? diveCenters
      : null
  }, [
    centerJourney,
    diveCenters,
    isNearbyCenterJourneyOpen,
    nearbyDiveCenterIds,
    selectedDiveSite,
    showFullControls,
    userGoal,
  ])
  const contextualDeparturePoints = useMemo<DeparturePointCollection | null>(() => {
    if (!departurePoints || showFullControls) return departurePoints
    if (userGoal !== 'boatTrip' || boatTripStep !== 'results' || !selectedDeparture) {
      return null
    }
    return { ...departurePoints, features: [selectedDeparture] }
  }, [boatTripStep, departurePoints, selectedDeparture, showFullControls, userGoal])
  const certificationLabel = `${diverProfile.agency} ${selectedCertification?.name ?? ''}`.trim()
  const shouldBackToCenterCatalog =
    selectedDiveCenter !== null &&
    (isNearbyCenterJourneyOpen || userGoal === 'findCenter')
  let desktopJourneyCatalog: ReactNode = null
  if (!isFullPlanningView && !selectedDiveCenter) {
    if (userGoal === 'findSites' && siteMatchStep === 'results' && !selectedDiveSite) {
      desktopJourneyCatalog = <DiveSiteCatalog
        sites={findSiteResults}
        analysis={siteAnalysis}
        selectedSite={selectedDiveSite}
        boatSpeedKnots={boatSpeedKnots}
        heading={t.catalog.sitesFound.replace('{count}', String(findSiteResults.length))}
        onSelect={selectDiveSite}
      />
    } else if (userGoal === 'exploreSite' && !selectedDiveSite) {
      desktopJourneyCatalog = <DiveSiteCatalog
        sites={exploredSites}
        analysis={siteAnalysis}
        selectedSite={selectedDiveSite}
        boatSpeedKnots={boatSpeedKnots}
        heading={t.catalog.exploreDiveSites}
        search={siteCatalogSearch}
        typeFilter={siteCatalogType}
        onSearchChange={setSiteCatalogSearch}
        onTypeFilterChange={setSiteCatalogType}
        onSelect={selectDiveSite}
      />
    } else if (userGoal === 'boatTrip' && boatTripStep === 'results' && !selectedDiveSite) {
      desktopJourneyCatalog = <DiveSiteCatalog
        sites={reachableSites}
        analysis={siteAnalysis}
        selectedSite={selectedDiveSite}
        boatSpeedKnots={boatSpeedKnots}
        heading={t.catalog.reachableDiveSites}
        onSelect={selectDiveSite}
      />
    } else if (userGoal === 'findCenter' && centerJourney === 'site') {
      desktopJourneyCatalog = selectedDiveSite ? <DiveCenterCatalog
        items={nearbyCenterCatalog}
        selectedCenter={selectedDiveCenter}
        heading={t.catalog.nearbyDiveCentersFor.replace('{site}', selectedDiveSite.properties.site_name)}
        onSelect={selectDiveCenter}
      /> : <DiveSiteCatalog
        sites={exploredSites}
        analysis={siteAnalysis}
        selectedSite={selectedDiveSite}
        boatSpeedKnots={boatSpeedKnots}
        heading={t.catalog.chooseSiteForCenters}
        search={siteCatalogSearch}
        typeFilter={siteCatalogType}
        onSearchChange={setSiteCatalogSearch}
        onTypeFilterChange={setSiteCatalogType}
        onSelect={selectDiveSite}
      />
    } else if (userGoal === 'findCenter' && centerJourney === 'browse') {
      desktopJourneyCatalog = <DiveCenterCatalog
        items={allCenterCatalog}
        selectedCenter={selectedDiveCenter}
        heading={t.catalog.browseAllCenters}
        search={centerCatalogSearch}
        onSearchChange={setCenterCatalogSearch}
        onSelect={selectDiveCenter}
      />
    }
  }
  const hasDesktopRightPanel =
    isDesktopLayout && Boolean(
      desktopJourneyCatalog ||
      (isDesktopDetailPanelOpen && (selectedDiveSite || selectedDiveCenter)),
    )

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

      <main
        className={`workspace${
          hasDesktopRightPanel
            ? ' has-detail-panel'
            : ''
        }`}
      >
        <aside
          className={`sidebar${isMobilePanelOpen ? ' is-mobile-open' : ''}${
            selectedDiveSite || selectedDiveCenter ? ' is-detail-open' : ''
          }`}
          id="planning-panel"
          aria-label={t.planning.planning}
        >
          <div className="mobile-panel-header">
            <div>
              <small>
                {userGoal ? t.goals.currentGoal : t.planning.results}
              </small>
              <strong>
                {userGoal
                  ? t.goals.options[userGoal].title
                  : `${resultCounts.matching} ${t.planning.matchingDiveSites}`}
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
            {userGoal ? <div className="desktop-sidebar-heading">
              <p className="eyebrow">{t.planning.planning}</p>
              <h2>{t.app.shortTitle}</h2>
            </div> : null}

            {userGoal ? (
              <GoalHeader
                goal={userGoal}
                onChangeGoal={changeGoal}
                onShowFullControls={openFullControls}
                onReturnToMap={returnToMap}
              />
            ) : null}

            {!isFullPlanningView && userGoal && isJourneyResultsVisible ? (
              <div className="catalog-view-toggle" role="group" aria-label={t.catalog.viewMode}>
                <button
                  type="button"
                  className={catalogView === 'list' ? 'is-active' : ''}
                  aria-pressed={catalogView === 'list'}
                  onClick={showCatalogList}
                >
                  {t.catalog.list}
                </button>
                <button
                  type="button"
                  className={catalogView === 'map' ? 'is-active' : ''}
                  aria-pressed={catalogView === 'map'}
                  onClick={showCatalogMap}
                >
                  {t.catalog.map}
                </button>
              </div>
            ) : null}

            {(selectedDiveSite || selectedDiveCenter) && !isFullPlanningView ? (
              <button
                className="journey-back"
                type="button"
                onClick={
                  isNearbyCenterJourneyOpen
                    ? selectedDiveCenter
                      ? backToNearbyCenterCatalog
                      : backToDiveSiteDetail
                    : shouldBackToCenterCatalog
                      ? backToNearbyCenterCatalog
                    : clearDetail
                }
              >
                ← {isNearbyCenterJourneyOpen
                  ? selectedDiveCenter
                    ? t.catalog.backToDiveCenters
                    : t.catalog.backToDiveSite
                  : shouldBackToCenterCatalog
                    ? t.catalog.backToDiveCenters
                  : t.catalog.backToResults}
              </button>
            ) : null}

            {isFullPlanningView ? (
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
            ) : null}

            {isFullPlanningView ? (
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
            ) : null}

            {isFullPlanningView ? (
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
                  showDiveType
                />
              </SidebarSection>
            ) : null}

            {!isFullPlanningView && userGoal === 'findSites' && !selectedDiveSite ? (
              <>
                {siteMatchStep !== 'results' ? <SiteMatchQuestions
                  step={siteMatchStep}
                  profile={diverProfile}
                  effectiveDepthLimit={effectiveDepthLimit}
                  matchingSiteCount={findSiteResults.length}
                  totalSiteCount={totalSiteCount}
                  selectedSiteType={selectedSiteType}
                  travelPreference={travelPreference}
                  departurePoints={departurePoints}
                  selectedDepartureId={selectedDepartureId}
                  maximumDistanceNm={maximumDistanceNm}
                  onProfileChange={setDiverProfile}
                  onSiteTypeChange={setSelectedSiteType}
                  onTravelPreferenceChange={selectTravelPreference}
                  onDepartureChange={setSelectedDepartureId}
                  onMaximumDistanceChange={setMaximumDistanceNm}
                  onBack={previousSiteMatchStep}
                  onNext={nextSiteMatchStep}
                /> : null}
                {siteMatchStep === 'results' ? <>
                <button className="journey-back" type="button" onClick={previousSiteMatchStep}>
                  ← {t.catalog.editChoices}
                </button>
                {!isDesktopLayout ? <DiveSiteCatalog
                  sites={findSiteResults}
                  analysis={siteAnalysis}
                  selectedSite={selectedDiveSite}
                  boatSpeedKnots={boatSpeedKnots}
                  heading={t.catalog.sitesFound.replace('{count}', String(findSiteResults.length))}
                  onSelect={selectDiveSite}
                /> : null}
                </> : null}
              </>
            ) : null}

            {!isDesktopLayout && !isFullPlanningView && userGoal === 'exploreSite' && !selectedDiveSite ? (
              <DiveSiteCatalog
                sites={exploredSites}
                analysis={siteAnalysis}
                selectedSite={selectedDiveSite}
                boatSpeedKnots={boatSpeedKnots}
                heading={t.catalog.exploreDiveSites}
                search={siteCatalogSearch}
                typeFilter={siteCatalogType}
                onSearchChange={setSiteCatalogSearch}
                onTypeFilterChange={setSiteCatalogType}
                onSelect={selectDiveSite}
              />
            ) : null}

            {!isFullPlanningView && userGoal === 'boatTrip' && !selectedDiveSite ? (
              <>
                {boatTripStep !== 'results' ? <BoatTripQuestions
                  step={boatTripStep}
                  departurePoints={departurePoints}
                  selectedDepartureId={selectedDepartureId}
                  boatSpeedKnots={boatSpeedKnots}
                  maximumDistanceNm={maximumDistanceNm}
                  onDepartureChange={setSelectedDepartureId}
                  onBoatSpeedChange={setBoatSpeedKnots}
                  onMaximumDistanceChange={setMaximumDistanceNm}
                  onBack={previousBoatTripStep}
                  onNext={nextBoatTripStep}
                /> : null}
                {boatTripStep === 'results' ? <>
                  <button className="journey-back" type="button" onClick={previousBoatTripStep}>
                    ← {t.catalog.editChoices}
                  </button>
                {!isDesktopLayout && selectedDeparture ? (
                  <DiveSiteCatalog
                    sites={reachableSites}
                    analysis={siteAnalysis}
                    selectedSite={selectedDiveSite}
                    boatSpeedKnots={boatSpeedKnots}
                    heading={t.catalog.reachableDiveSites}
                    onSelect={selectDiveSite}
                  />
                ) : !isDesktopLayout ? (
                  <div className="catalog-empty">
                    <strong>{t.catalog.selectDepartureFirst}</strong>
                    <span>{t.catalog.selectDepartureHelp}</span>
                  </div>
                ) : null}
                </> : null}
              </>
            ) : null}

            {!isFullPlanningView && userGoal === 'findCenter' ? (
              <>
                <CenterJourneyChoice
                  value={centerJourney}
                  onChange={selectCenterJourney}
                />
                {!isDesktopLayout && centerJourney === 'site' && !selectedDiveSite ? (
                  <DiveSiteCatalog
                    sites={exploredSites}
                    analysis={siteAnalysis}
                    selectedSite={selectedDiveSite}
                    boatSpeedKnots={boatSpeedKnots}
                    heading={t.catalog.chooseSiteForCenters}
                    search={siteCatalogSearch}
                    typeFilter={siteCatalogType}
                    onSearchChange={setSiteCatalogSearch}
                    onTypeFilterChange={setSiteCatalogType}
                    onSelect={selectDiveSite}
                  />
                ) : null}
                {!isDesktopLayout && centerJourney === 'site' && selectedDiveSite && !selectedDiveCenter ? (
                  <DiveCenterCatalog
                    items={nearbyCenterCatalog}
                    selectedCenter={selectedDiveCenter}
                    heading={t.catalog.nearbyDiveCentersFor.replace(
                      '{site}',
                      selectedDiveSite.properties.site_name,
                    )}
                    onSelect={selectDiveCenter}
                  />
                ) : null}
                {!isDesktopLayout && centerJourney === 'browse' && !selectedDiveCenter ? (
                  <DiveCenterCatalog
                    items={allCenterCatalog}
                    selectedCenter={selectedDiveCenter}
                    heading={t.catalog.browseAllCenters}
                    search={centerCatalogSearch}
                    onSearchChange={setCenterCatalogSearch}
                    onSelect={selectDiveCenter}
                  />
                ) : null}
              </>
            ) : null}

            {!isDesktopLayout && isNearbyCenterJourneyOpen && selectedDiveSite && !selectedDiveCenter ? (
              <DiveCenterCatalog
                items={nearbyCenterCatalog}
                selectedCenter={selectedDiveCenter}
                heading={t.catalog.nearbyDiveCentersFor.replace(
                  '{site}',
                  selectedDiveSite.properties.site_name,
                )}
                onSelect={selectDiveCenter}
              />
            ) : null}

            {!isDesktopLayout && selectedDiveSite && userGoal !== 'findCenter' && !selectedDiveCenter && !isNearbyCenterJourneyOpen ? (
              <DiveSiteDetails
                site={selectedDiveSite}
                enrichment={selectedSiteEnrichment}
                selectedDeparture={selectedDeparture}
                directDistanceNm={selectedDiveSiteDistanceNm}
                boatSpeedKnots={boatSpeedKnots}
                nearbyDepartures={nearbyDepartureOptions}
                certificationLabel={certificationLabel}
                effectiveDepthLimit={effectiveDepthLimit}
                onFindDiveCenters={openNearbyCenterJourney}
                onPlanBoatTrip={planBoatTripForSelectedSite}
                onShowOnMap={showSelectedSiteOnMap}
              />
            ) : null}

            {!isDesktopLayout && selectedDiveCenter ? (
              <DiveCenterDetails
                center={selectedDiveCenter}
                enrichment={selectedCenterEnrichment}
                nearbySites={nearbySitesForCenter}
                onSelectSite={selectDiveSite}
              />
            ) : null}

            {isFullPlanningView ? (
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
            ) : null}

            {isFullPlanningView ? (
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
            ) : null}
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
            diveCenters={contextualDiveCenters}
            departurePoints={contextualDeparturePoints}
            visibility={contextualVisibility}
            siteAnalysis={siteAnalysis}
            analysisKey={filterKey}
            selectedDeparture={showTripAnalysis ? selectedDeparture : null}
            selectedDiveSite={selectedDiveSite}
            selectedDiveCenter={selectedDiveCenter}
            nearbyDiveCenterIds={nearbyDiveCenterIds}
            resultSiteNames={activeCatalogSiteNames}
            resultCenterIds={activeCatalogCenterIds}
            maximumDistanceNm={maximumDistanceNm}
            boatSpeedKnots={boatSpeedKnots}
            showTripAnalysis={showTripAnalysis}
            showLegend={isJourneyResultsVisible}
            resultDiveSites={activeCatalogSites}
            resultKey={activeCatalogKey}
            focusedResultMode={isFocusedSiteResultMode}
            showOtherDiveSites={showOtherDiveSites}
            canShowOtherDiveSites={canShowOtherDiveSites}
            onShowOtherDiveSitesChange={setShowOtherDiveSites}
            onSelectDeparture={toggleDepartureFromMap}
            onSelectDiveSite={toggleDiveSiteFromMap}
            onSelectDiveCenter={toggleDiveCenterFromMap}
          />
          {isAnythingLoading && (
            <div className="map-message">{t.status.loadingMapLayers}</div>
          )}
        </section>
        {hasDesktopRightPanel ? (
          <aside
            className="detail-panel"
            aria-label={selectedDiveSite || selectedDiveCenter ? t.map.closeDetails : t.planning.results}
          >
            {selectedDiveSite || selectedDiveCenter ? <div className="detail-panel__toolbar">
              <button type="button" onClick={clearDetail}>
                <span aria-hidden="true">×</span>
                {t.map.closeDetails}
              </button>
            </div> : null}
            <div className="detail-panel__content">
              {desktopJourneyCatalog && !selectedDiveCenter ? desktopJourneyCatalog : isNearbyCenterJourneyOpen && selectedDiveCenter ? (
                <>
                  <button className="journey-back" type="button" onClick={backToNearbyCenterCatalog}>
                    ← {t.catalog.backToDiveCenters}
                  </button>
                  <DiveCenterDetails
                    center={selectedDiveCenter}
                    enrichment={selectedCenterEnrichment}
                    nearbySites={nearbySitesForCenter}
                    onSelectSite={selectDiveSite}
                  />
                </>
              ) : isNearbyCenterJourneyOpen && selectedDiveSite ? (
                <>
                  <button className="journey-back" type="button" onClick={backToDiveSiteDetail}>
                    ← {t.catalog.backToDiveSite}
                  </button>
                  <DiveCenterCatalog
                    items={nearbyCenterCatalog}
                    selectedCenter={selectedDiveCenter}
                    heading={t.catalog.nearbyDiveCentersFor.replace(
                      '{site}',
                      selectedDiveSite.properties.site_name,
                    )}
                    onSelect={selectDiveCenter}
                  />
                </>
              ) : selectedDiveCenter ? (
                <>
                  {userGoal === 'findCenter' ? (
                    <button className="journey-back" type="button" onClick={backToNearbyCenterCatalog}>
                      ← {t.catalog.backToDiveCenters}
                    </button>
                  ) : null}
                  <DiveCenterDetails
                    center={selectedDiveCenter}
                    enrichment={selectedCenterEnrichment}
                    nearbySites={nearbySitesForCenter}
                    onSelectSite={selectDiveSite}
                  />
                </>
              ) : selectedDiveSite ? (
                <DiveSiteDetails
                  site={selectedDiveSite}
                  enrichment={selectedSiteEnrichment}
                  selectedDeparture={selectedDeparture}
                  directDistanceNm={selectedDiveSiteDistanceNm}
                  boatSpeedKnots={boatSpeedKnots}
                  nearbyDepartures={nearbyDepartureOptions}
                  certificationLabel={certificationLabel}
                  effectiveDepthLimit={effectiveDepthLimit}
                  onFindDiveCenters={openNearbyCenterJourney}
                  onPlanBoatTrip={planBoatTripForSelectedSite}
                  onShowOnMap={showSelectedSiteOnMap}
                />
              ) : null}
            </div>
          </aside>
        ) : null}
        {isOpeningExperienceOpen ? (
          <OpeningExperience
            onSelect={selectGoal}
            onReturnToMap={returnToMap}
          />
        ) : null}
        {userGoal ? <button
          className="mobile-filter-toggle"
          type="button"
          aria-controls="planning-panel"
          aria-expanded={isMobilePanelOpen}
          onClick={showCatalogList}
        >
          <span>{userGoal && isJourneyResultsVisible ? t.catalog.list : t.planning.openFilters}</span>
          {isJourneyResultsVisible ? <strong>{activeCatalogSites.length}</strong> : null}
        </button> : null}
      </main>

      <footer>
        <span>{t.disclaimer}</span>
        <strong>{t.credit}</strong>
      </footer>
    </div>
  )
}

export default App
