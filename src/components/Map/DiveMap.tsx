import { divIcon, marker, type Layer } from 'leaflet'
import { GeoJSON, MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import type { LayerState } from '../../App'
import { certificationTranslations } from '../../i18n/certificationTranslations'
import { useLanguage } from '../../i18n/LanguageContext'
import type { Translation } from '../../i18n/translations'
import type {
  DeparturePointCollection,
  DeparturePointFeature,
  DiveCenterCollection,
  DiveCenterFeature,
  DiveSiteCollection,
  DiveSiteFeature,
} from '../../types/gis'

interface DiveMapProps {
  diveSites: DiveSiteCollection | null
  diveCenters: DiveCenterCollection | null
  departurePoints: DeparturePointCollection | null
  visibility: LayerState<boolean>
  effectiveDepthLimit: number | null
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
  diveCenters: divIcon({
    className: 'feature-marker-wrapper',
    html: '<span class="feature-marker feature-marker--dive-center" aria-hidden="true">+</span>',
    iconSize: [17, 17],
    iconAnchor: [8.5, 8.5],
    popupAnchor: [0, -9],
  }),
  departurePoints: divIcon({
    className: 'feature-marker-wrapper',
    html: '<span class="feature-marker feature-marker--departure"><span></span></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
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
  effectiveDepthLimit,
}: DiveMapProps) {
  const { language, t } = useLanguage()
  const certificationCopy = certificationTranslations[language]

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

      {visibility.departurePoints && departurePoints && (
        <GeoJSON
          key={`departure-points-${language}`}
          data={departurePoints}
          pointToLayer={(feature, latlng) =>
            marker(latlng, {
              icon: MAP_ICONS.departurePoints,
              title: (feature as DeparturePointFeature).properties.name,
            })
          }
          onEachFeature={(feature, layer: Layer) => {
            const properties = (feature as DeparturePointFeature).properties
            const type = localizeDataValue(properties.type, t)

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
          key={`dive-centers-${language}`}
          data={diveCenters}
          pointToLayer={(feature, latlng) =>
            marker(latlng, {
              icon: MAP_ICONS.diveCenters,
              title: (feature as DiveCenterFeature).properties.name,
            })
          }
          onEachFeature={(feature, layer: Layer) => {
            const properties = (feature as DiveCenterFeature).properties

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
          key={`dive-sites-${language}-${effectiveDepthLimit ?? 'none'}`}
          data={diveSites}
          pointToLayer={(feature, latlng) => {
            const properties = (feature as DiveSiteFeature).properties
            const isWithinLimit =
              effectiveDepthLimit === null ||
              (properties.max_depth_m !== null &&
                properties.max_depth_m <= effectiveDepthLimit)

            return marker(latlng, {
              icon: isWithinLimit
                ? MAP_ICONS.diveSites
                : MAP_ICONS.diveSitesMuted,
              title: properties.site_name,
            })
          }}
          onEachFeature={(feature, layer: Layer) => {
            const properties = (feature as DiveSiteFeature).properties
            const siteType = localizeDataValue(properties.site_type, t)
            const isWithinLimit =
              effectiveDepthLimit === null ||
              (properties.max_depth_m !== null &&
                properties.max_depth_m <= effectiveDepthLimit)
            const depthResult =
              effectiveDepthLimit === null
                ? ''
                : popupRow(
                    certificationCopy.ui.status,
                    isWithinLimit
                      ? certificationCopy.ui.withinLimit
                      : certificationCopy.ui.exceedsLimit,
                  )

            layer.bindPopup(`
              <article class="site-popup">
                <p class="site-popup__eyebrow">${escapeHtml(siteType)}</p>
                <h2>${escapeHtml(properties.site_name)}</h2>
                <dl>
                  ${popupRow(t.popup.depthRange, formatDepth(properties.min_depth_m, properties.max_depth_m, t))}
                  ${popupRow(t.popup.moorings, properties.mooring_count)}
                  ${popupRow(t.popup.access, localizeDataValue(properties.access_type, t))}
                  ${depthResult}
                </dl>
              </article>
            `)
          }}
        />
      )}
    </MapContainer>
  )
}
