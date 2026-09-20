import { marker, type Layer } from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
  ZoomControl,
} from 'react-leaflet'
import type { LayerState } from '../../App'
import {
  BASEMAPS,
  createMapIcon,
  diveSiteSymbol,
  MAP_ANALYSIS_STYLES,
  NAUTICAL_OVERLAY,
  type BasemapId,
} from '../../config/mapStyles'
import { certificationTranslations } from '../../i18n/certificationTranslations'
import { useLanguage } from '../../i18n/LanguageContext'
import type { Translation } from '../../i18n/translations'
import type {
  DeparturePointCollection,
  DeparturePointFeature,
  DiveSiteAnalysis,
  DiveCenterCollection,
  DiveCenterFeature,
  DiveSiteCollection,
  DiveSiteFeature,
} from '../../types/gis'
import {
  calculateTravelTimeMinutes,
  createDirectRouteLine,
  createReachZone,
} from '../../utils/spatial'
import { MapOverlayControls } from './MapOverlayControls'

interface DiveMapProps {
  diveSites: DiveSiteCollection | null
  diveCenters: DiveCenterCollection | null
  departurePoints: DeparturePointCollection | null
  visibility: LayerState<boolean>
  siteAnalysis: ReadonlyMap<DiveSiteFeature, DiveSiteAnalysis>
  analysisKey: string
  selectedDeparture: DeparturePointFeature | null
  selectedDiveSite: DiveSiteFeature | null
  selectedDiveCenter: DiveCenterFeature | null
  nearbyDiveCenterIds: ReadonlySet<number>
  resultSiteNames: ReadonlySet<string>
  resultCenterIds: ReadonlySet<number>
  maximumDistanceNm: number
  boatSpeedKnots: number
  onSelectDeparture: (recordId: number) => void
  onSelectDiveSite: (site: DiveSiteFeature) => void
  onSelectDiveCenter: (center: DiveCenterFeature) => void
}

const FLORIDA_KEYS_CENTER: [number, number] = [24.72, -81.1]
const SESSION_BASEMAP_KEY = 'dive-planner-basemap'
const SESSION_NAUTICAL_KEY = 'dive-planner-nautical-overlay'

function readBasemap(): BasemapId {
  const value = window.sessionStorage.getItem(SESSION_BASEMAP_KEY)
  return value === 'street' || value === 'satellite' ? value : 'light'
}

function featureLatLng(
  feature: DiveSiteFeature | DiveCenterFeature | DeparturePointFeature,
): [number, number] {
  const [longitude, latitude] = feature.geometry.coordinates
  return [latitude, longitude]
}

function MapFocusController({
  selectedDeparture,
  selectedDiveSite,
  selectedDiveCenter,
}: Pick<
  DiveMapProps,
  'selectedDeparture' | 'selectedDiveSite' | 'selectedDiveCenter'
>) {
  const map = useMap()

  useEffect(() => {
    if (selectedDeparture && selectedDiveSite) {
      map.fitBounds(
        [featureLatLng(selectedDeparture), featureLatLng(selectedDiveSite)],
        { animate: true, duration: 0.6, maxZoom: 11, padding: [52, 52] },
      )
      return
    }

    const selectedFeature = selectedDiveCenter ?? selectedDiveSite
    if (selectedFeature) {
      map.flyTo(featureLatLng(selectedFeature), Math.max(map.getZoom(), 10), {
        animate: true,
        duration: 0.55,
      })
    }
  }, [map, selectedDeparture, selectedDiveCenter, selectedDiveSite])

  return null
}

function MapResizeController() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    observer.observe(container)

    return () => observer.disconnect()
  }, [map])

  return null
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#039;',
        '"': '&quot;',
      })[character]!,
  )
}

function hasValue(value: string | number | null | undefined): boolean {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function popupRow(
  label: string,
  value: string | number | null | undefined,
): string {
  if (!hasValue(value)) return ''

  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`
}

function safeWebsiteUrl(value: string | null): string | null {
  if (!hasValue(value)) return null

  try {
    const url = new URL(value!)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function websiteRow(
  label: string,
  linkText: string,
  website: string | null,
): string {
  const url = safeWebsiteUrl(website)
  if (!url) return ''

  return `<div><dt>${escapeHtml(label)}</dt><dd><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkText)}</a></dd></div>`
}

function formatDepth(
  minimum: number | null,
  maximum: number | null,
  t: Translation,
): string {
  if (minimum == null && maximum == null) return t.popup.notAvailable
  if (minimum == null) {
    return t.popup.upToDepth.replace('{depth}', String(maximum))
  }
  if (maximum == null) {
    return t.popup.fromDepth.replace('{depth}', String(minimum))
  }
  return `${minimum}–${maximum} m`
}

function localizeDataValue(value: string | null, t: Translation): string {
  const normalizedValue = value?.trim().toLowerCase()
  const knownValues: Record<string, string> = {
    reef: t.dataValues.reef,
    wreck: t.dataValues.wreck,
    wall: t.dataValues.wall,
    marina: t.dataValues.marina,
    'boat ramp': t.dataValues.boatRamp,
    boat: t.dataValues.boat,
  }

  return (normalizedValue && knownValues[normalizedValue]) || value || t.popup.notListed
}

export function DiveMap({
  diveSites,
  diveCenters,
  departurePoints,
  visibility,
  siteAnalysis,
  analysisKey,
  selectedDeparture,
  selectedDiveSite,
  selectedDiveCenter,
  nearbyDiveCenterIds,
  resultSiteNames,
  resultCenterIds,
  maximumDistanceNm,
  boatSpeedKnots,
  onSelectDeparture,
  onSelectDiveSite,
  onSelectDiveCenter,
}: DiveMapProps) {
  const { language, t } = useLanguage()
  const [basemap, setBasemap] = useState<BasemapId>(readBasemap)
  const [nauticalVisible, setNauticalVisible] = useState(
    () => window.sessionStorage.getItem(SESSION_NAUTICAL_KEY) === 'true',
  )
  const certificationCopy = certificationTranslations[language]
  const basemapDefinition = BASEMAPS[basemap]
  const reachZone = useMemo(
    () =>
      selectedDeparture
        ? createReachZone(selectedDeparture, maximumDistanceNm)
        : null,
    [maximumDistanceNm, selectedDeparture],
  )
  const directRoute = useMemo(
    () =>
      selectedDeparture && selectedDiveSite
        ? createDirectRouteLine(selectedDeparture, selectedDiveSite)
        : null,
    [selectedDeparture, selectedDiveSite],
  )

  const changeBasemap = (nextBasemap: BasemapId) => {
    window.sessionStorage.setItem(SESSION_BASEMAP_KEY, nextBasemap)
    setBasemap(nextBasemap)
  }
  const changeNautical = (visible: boolean) => {
    window.sessionStorage.setItem(SESSION_NAUTICAL_KEY, String(visible))
    setNauticalVisible(visible)
  }

  return (
    <>
      <MapContainer
      center={FLORIDA_KEYS_CENTER}
      zoom={8}
      minZoom={6}
      className="map"
      scrollWheelZoom
      zoomControl={false}
    >
      <ZoomControl
        key={language}
        position="topleft"
        zoomInTitle={t.map.zoomIn}
        zoomOutTitle={t.map.zoomOut}
      />
      <TileLayer
        key={basemap}
        attribution={basemapDefinition.attribution}
        url={basemapDefinition.url}
        maxZoom={basemapDefinition.maxZoom}
      />
      {basemapDefinition.labelUrl ? (
        <TileLayer
          key={`${basemap}-labels`}
          url={basemapDefinition.labelUrl}
          maxZoom={basemapDefinition.maxZoom}
          pane="overlayPane"
        />
      ) : null}
      {nauticalVisible ? (
        <TileLayer
          key="nautical-seamarks"
          attribution={NAUTICAL_OVERLAY.attribution}
          url={NAUTICAL_OVERLAY.url}
          maxZoom={NAUTICAL_OVERLAY.maxZoom}
          pane="overlayPane"
        />
      ) : null}

      <MapFocusController
        selectedDeparture={selectedDeparture}
        selectedDiveSite={selectedDiveSite}
        selectedDiveCenter={selectedDiveCenter}
      />
      <MapResizeController />

      {reachZone && (
        <GeoJSON
          key={`reach-zone-${selectedDeparture?.properties.record_id}-${maximumDistanceNm}`}
          data={reachZone}
          style={{
            className: 'reach-zone-path',
            color: MAP_ANALYSIS_STYLES.reachZone.color,
            weight: 1.5,
            opacity: 0.72,
            fillColor: MAP_ANALYSIS_STYLES.reachZone.fillColor,
            fillOpacity: 0.08,
          }}
          onEachFeature={(_, layer: Layer) => {
            layer.bindTooltip(
              `${escapeHtml(t.planning.reachZone)} · ${maximumDistanceNm} NM`,
              { sticky: true },
            )
          }}
        />
      )}

      {directRoute && (
        <GeoJSON
          key={`direct-route-${selectedDeparture?.properties.record_id}-${selectedDiveSite?.properties.site_name}`}
          data={directRoute}
          style={{
            className: 'direct-route-path',
            color: MAP_ANALYSIS_STYLES.directRoute.color,
            weight: 3.5,
            opacity: 0.92,
            dashArray: '8 7',
          }}
          onEachFeature={(_, layer: Layer) => {
            layer.bindTooltip(
              `<strong>${escapeHtml(t.planning.directBoatRouteEstimate)}</strong><br>${escapeHtml(t.planning.directRouteDisclaimer)}`,
              { sticky: true },
            )
          }}
        />
      )}

      {visibility.departurePoints && departurePoints && (
        <GeoJSON
          key={`departure-points-${language}-${selectedDeparture?.properties.record_id ?? 'none'}`}
          data={departurePoints}
          pointToLayer={(feature, latlng) => {
            const departure = feature as DeparturePointFeature
            const isSelected =
              departure.properties.record_id ===
              selectedDeparture?.properties.record_id
            return marker(latlng, {
              icon: createMapIcon(
                'departure',
                isSelected ? 'selected' : selectedDeparture ? 'muted' : 'default',
              ),
              title: (feature as DeparturePointFeature).properties.name,
            })
          }}
          onEachFeature={(feature, layer: Layer) => {
            const properties = (feature as DeparturePointFeature).properties
            const type = localizeDataValue(properties.type, t)

            layer.on('click', () => onSelectDeparture(properties.record_id))

            layer.bindPopup(`
              <article class="site-popup">
                <p class="site-popup__eyebrow">${escapeHtml(t.dataValues.departurePoint)}</p>
                <h2>${escapeHtml(properties.name)}</h2>
                <dl>
                  ${popupRow(t.popup.type, type)}
                  ${popupRow(t.popup.operator, properties.operator)}
                  ${websiteRow(t.popup.website, t.popup.visitWebsite, properties.website)}
                </dl>
              </article>
            `)
          }}
        />
      )}

      {visibility.diveCenters && diveCenters && (
        <GeoJSON
          key={`dive-centers-${language}-${selectedDiveSite?.properties.site_name ?? 'none'}-${selectedDiveCenter?.properties.record_id ?? 'none'}-${Array.from(nearbyDiveCenterIds).join('-')}-${Array.from(resultCenterIds).join('-')}`}
          data={diveCenters}
          pointToLayer={(feature, latlng) => {
            const center = feature as DiveCenterFeature
            const isNearby = nearbyDiveCenterIds.has(center.properties.record_id)
            const isSelected = center.properties.record_id === selectedDiveCenter?.properties.record_id
            const isCatalogResult = resultCenterIds.has(center.properties.record_id)

            return marker(latlng, {
              icon: createMapIcon(
                'diveCenter',
                isSelected
                  ? 'selected'
                  : !isCatalogResult
                    ? 'muted'
                    : selectedDiveSite
                      ? isNearby
                        ? 'nearby'
                        : 'muted'
                      : 'default',
              ),
              title: center.properties.name,
            })
          }}
          onEachFeature={(feature, layer: Layer) => {
            const center = feature as DiveCenterFeature
            const properties = center.properties

            layer.on('click', () => onSelectDiveCenter(center))

            layer.bindPopup(`
              <article class="site-popup">
                <p class="site-popup__eyebrow">${escapeHtml(t.dataValues.diveCenter)}</p>
                <h2>${escapeHtml(properties.name)}</h2>
                <dl>
                  ${popupRow(t.popup.category, properties.category)}
                  ${popupRow(t.popup.phone, properties.phone)}
                  ${popupRow(t.popup.address, properties.address)}
                  ${websiteRow(t.popup.website, t.popup.visitWebsite, properties.website)}
                </dl>
              </article>
            `)
          }}
        />
      )}

      {visibility.diveSites && diveSites && (
        <GeoJSON
          key={`dive-sites-${language}-${analysisKey}-${selectedDiveSite?.properties.site_name ?? 'none'}`}
          data={diveSites}
          pointToLayer={(feature, latlng) => {
            const site = feature as DiveSiteFeature
            const properties = site.properties
            const result = siteAnalysis.get(site)
            const isSelected = site === selectedDiveSite
            const isMatching =
              resultSiteNames.has(properties.site_name) &&
              Boolean(result?.isFullMatch)

            return marker(latlng, {
              icon: createMapIcon(
                diveSiteSymbol(properties.site_type),
                isSelected ? 'selected' : isMatching ? 'matching' : 'muted',
              ),
              title: properties.site_name,
            })
          }}
          onEachFeature={(feature, layer: Layer) => {
            const site = feature as DiveSiteFeature
            const properties = site.properties
            const siteType = localizeDataValue(properties.site_type, t)
            const result = siteAnalysis.get(site)
            const depthResult = result
              ? popupRow(
                  certificationCopy.ui.status,
                  result.matchesDepth
                    ? certificationCopy.ui.withinLimit
                    : certificationCopy.ui.exceedsLimit,
                )
              : ''
            const distanceResult =
              selectedDeparture && result?.distanceNm != null
                ? `
                  ${popupRow(t.planning.departurePoint, selectedDeparture.properties.name)}
                  ${popupRow(t.planning.directBoatDistance, `${result.distanceNm.toFixed(1)} NM`)}
                  ${popupRow(t.planning.boatSpeed, `${boatSpeedKnots} ${t.planning.knotAbbreviation}`)}
                  ${popupRow(t.planning.estimatedTravelTime, `${calculateTravelTimeMinutes(result.distanceNm, boatSpeedKnots)} ${t.planning.minutes}`)}
                `
                : ''
            const distanceDisclaimer = selectedDeparture
              ? `<p class="site-popup__notice"><strong>${escapeHtml(t.planning.directBoatRouteEstimate)}</strong><br>${escapeHtml(t.planning.directRouteDisclaimer)}</p>`
              : ''

            layer.on('click', () => {
              onSelectDiveSite(site)
            })

            layer.bindPopup(`
              <article class="site-popup">
                <p class="site-popup__eyebrow">${escapeHtml(siteType)}</p>
                <h2>${escapeHtml(properties.site_name)}</h2>
                <dl>
                  ${popupRow(t.popup.depthRange, formatDepth(properties.min_depth_m, properties.max_depth_m, t))}
                  ${popupRow(t.popup.moorings, properties.mooring_count)}
                  ${popupRow(t.popup.access, localizeDataValue(properties.access_type, t))}
                  ${depthResult}
                  ${distanceResult}
                </dl>
                ${distanceDisclaimer}
              </article>
            `)
          }}
        />
      )}
      </MapContainer>
      <MapOverlayControls
        basemap={basemap}
        nauticalVisible={nauticalVisible}
        onBasemapChange={changeBasemap}
        onNauticalChange={changeNautical}
      />
    </>
  )
}
