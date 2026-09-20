import { divIcon, type DivIcon } from 'leaflet'

export type BasemapId = 'light' | 'street' | 'satellite'
export type MapSymbolId = 'reef' | 'wreck' | 'wall' | 'diveCenter' | 'departure'
export type MapSymbolVariant = 'matching' | 'muted' | 'selected' | 'nearby' | 'default'

export const BASEMAPS: Record<
  BasemapId,
  { url: string; attribution: string; maxZoom: number; labelUrl?: string }
> = {
  light: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    labelUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community',
    maxZoom: 16,
  },
  street: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Source: <a href="https://www.esri.com/">Esri</a>, Vantor, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  },
}

export const NAUTICAL_OVERLAY = {
  url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
  attribution:
    'Nautical data &copy; <a href="https://www.openseamap.org/">OpenSeaMap</a> contributors',
  maxZoom: 18,
} as const

export const MAP_ANALYSIS_STYLES = {
  reachZone: {
    color: '#087c8c',
    fillColor: '#32aab4',
  },
  directRoute: {
    color: '#f07832',
  },
} as const

export const MAP_SYMBOLS: Record<
  MapSymbolId,
  { body: string; viewBox: string }
> = {
  reef: {
    viewBox: '0 0 24 24',
    body: '<path d="M12 21V9m0 6-4-4m4 1 4-4m-8 10-3-3m11 3 3-3M5 21h14"/>',
  },
  wreck: {
    viewBox: '0 0 24 24',
    body: '<path d="M4 14h16l-3 6H7l-3-6Zm5 0V7h6v7M7 7h10M12 7V4"/>',
  },
  wall: {
    viewBox: '0 0 24 24',
    body: '<path d="M5 3h14v18H5V3Zm4 0v5l3 3-3 4v6m10-12-4 3 4 4"/>',
  },
  diveCenter: {
    viewBox: '0 0 24 24',
    body: '<path d="M8 5h8v14H8zM10 2h4v3m-4 14h4v3M5 8h3m8 0h3v6h-3M5 11v4"/>',
  },
  departure: {
    viewBox: '0 0 24 24',
    body: '<path d="M12 3v17m-5-7H3a9 9 0 0 0 18 0h-4M9 6a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z"/>',
  },
}

export function mapSymbolSvg(symbol: MapSymbolId): string {
  const definition = MAP_SYMBOLS[symbol]
  return `<svg viewBox="${definition.viewBox}" aria-hidden="true" focusable="false">${definition.body}</svg>`
}

const iconCache = new Map<string, DivIcon>()

export function createMapIcon(
  symbol: MapSymbolId,
  variant: MapSymbolVariant,
): DivIcon {
  const cacheKey = `${symbol}-${variant}`
  const cached = iconCache.get(cacheKey)
  if (cached) return cached

  const selected = variant === 'selected'
  const size = selected ? 44 : 38
  const icon = divIcon({
    className: `feature-marker-wrapper feature-marker-wrapper--${variant}`,
    html: `<span class="map-symbol map-symbol--${symbol} map-symbol--${variant}">${mapSymbolSvg(symbol)}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  })
  iconCache.set(cacheKey, icon)
  return icon
}

export function diveSiteSymbol(siteType: string | null): MapSymbolId {
  const normalized = siteType?.trim().toLowerCase()
  if (normalized === 'wreck') return 'wreck'
  if (normalized === 'wall') return 'wall'
  return 'reef'
}
