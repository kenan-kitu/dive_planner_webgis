import { divIcon, marker, type Layer, type Marker } from 'leaflet'
import { useMemo } from 'react'
import { GeoJSON, MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import type { LayerState } from '../../App'
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
  maximumDistanceNm: number
  boatSpeedKnots: number
  onSelectDeparture: (recordId: number) => void
  onSelectDiveSite: (site: DiveSiteFeature) => void
  onSelectDiveCenter: (center: DiveCenterFeature) => void
}

const FLORIDA_KEYS_CENTER: [number, number] = [24.72, -81.1]

const MAP_ICONS = {
  diveSites: divIcon({
    className: 'feature-marker-wrapper',
    html: '<span class="feature-marker feature-marker--dive-site"><span></span></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  }),
  diveSitesMuted: divIcon({
    className: 'feature-marker-wrapper',
    html: '<span class="feature-marker feature-marker--dive-site feature-marker--outside-depth"><span></span></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  }),
  diveSiteSelected: divIcon({
    className: 'feature-marker-wrapper feature-marker-wrapper--site-selected',
    html: '<span class="feature-marker feature-marker--dive-site feature-marker--dive-site-selected"><span></span></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  }),
  diveCenters: divIcon({
    className: 'feature-marker-wrapper',
    html: '<span class="feature-marker feature-marker--dive-center" aria-hidden="true">+</span>',
    iconSize: [17, 17],
    iconAnchor: [8.5, 8.5],
    popupAnchor: [0, -9],
  }),
  diveCentersMuted: divIcon({
    className: 'feature-marker-wrapper',
    html: '<span class="feature-marker feature-marker--dive-center feature-marker--dive-center-muted" aria-hidden="true">+</span>',
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5],
    popupAnchor: [0, -8],
  }),
  diveCentersNearby: divIcon({
    className: 'feature-marker-wrapper feature-marker-wrapper--nearby-center',
    html: '<span class="feature-marker feature-marker--dive-center feature-marker--dive-center-nearby" aria-hidden="true">+</span>',
    iconSize: [21, 21],
    iconAnchor: [10.5, 10.5],
    popupAnchor: [0, -11],
  }),
  diveCenterSelected: divIcon({
    className: 'feature-marker-wrapper feature-marker-wrapper--center-selected',
    html: '<span class="feature-marker feature-marker--dive-center feature-marker--dive-center-selected" aria-hidden="true">+</span>',
    iconSize: [23, 23],
    iconAnchor: [11.5, 11.5],
    popupAnchor: [0, -12],
  }),
  departurePoints: divIcon({
    className: 'feature-marker-wrapper',
    html: '<span class="feature-marker feature-marker--departure"><span></span></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  }),
  departurePointsMuted: divIcon({
    className: 'feature-marker-wrapper',
    html: '<span class="feature-marker feature-marker--departure feature-marker--departure-muted"><span></span></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  }),
  departurePointSelected: divIcon({
    className: 'feature-marker-wrapper feature-marker-wrapper--selected',
    html: '<span class="feature-marker feature-marker--departure feature-marker--departure-selected"><span></span></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  }),
} as const

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
  maximumDistanceNm,
  boatSpeedKnots,
  onSelectDeparture,
  onSelectDiveSite,
  onSelectDiveCenter,
}: DiveMapProps) {
  const { language, t } = useLanguage()
  const certificationCopy = certificationTranslations[language]
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

  return (
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {reachZone && (
        <GeoJSON
          key={`reach-zone-${selectedDeparture?.properties.record_id}-${maximumDistanceNm}`}
          data={reachZone}
          style={{
            className: 'reach-zone-path',
            color: '#147d8c',
            weight: 1.5,
            opacity: 0.72,
            fillColor: '#35aab5',
            fillOpacity: 0.1,
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
            color: '#f07832',
            weight: 3,
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
              icon: isSelected
                ? MAP_ICONS.departurePointSelected
                : selectedDeparture
                  ? MAP_ICONS.departurePointsMuted
                  : MAP_ICONS.departurePoints,
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
          key={`dive-centers-${language}-${selectedDiveSite?.properties.site_name ?? 'none'}-${selectedDiveCenter?.properties.record_id ?? 'none'}-${Array.from(nearbyDiveCenterIds).join('-')}`}
          data={diveCenters}
          pointToLayer={(feature, latlng) => {
            const center = feature as DiveCenterFeature
            const isNearby = nearbyDiveCenterIds.has(center.properties.record_id)
            const isSelected = center.properties.record_id === selectedDiveCenter?.properties.record_id

            return marker(latlng, {
              icon: isSelected
                ? MAP_ICONS.diveCenterSelected
                : selectedDiveSite
                ? isNearby
                  ? MAP_ICONS.diveCentersNearby
                  : MAP_ICONS.diveCentersMuted
                : MAP_ICONS.diveCenters,
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
          key={`dive-sites-${language}-${analysisKey}`}
          data={diveSites}
          pointToLayer={(feature, latlng) => {
            const site = feature as DiveSiteFeature
            const properties = site.properties
            const result = siteAnalysis.get(site)
            const isSelected = site === selectedDiveSite

            return marker(latlng, {
              icon: isSelected
                ? MAP_ICONS.diveSiteSelected
                : result?.isFullMatch !== false
                  ? MAP_ICONS.diveSites
                  : MAP_ICONS.diveSitesMuted,
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
              document
                .querySelectorAll('.feature-marker--dive-site-selected')
                .forEach((element) =>
                  element.classList.remove('feature-marker--dive-site-selected'),
                )
              document
                .querySelectorAll('.feature-marker-wrapper--site-selected')
                .forEach((element) =>
                  element.classList.remove(
                    'feature-marker-wrapper--site-selected',
                  ),
                )

              const markerElement = (layer as Marker).getElement()
              markerElement?.classList.add(
                'feature-marker-wrapper--site-selected',
              )
              markerElement
                ?.querySelector('.feature-marker--dive-site')
                ?.classList.add('feature-marker--dive-site-selected')
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
  )
}
