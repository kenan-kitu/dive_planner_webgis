import { GEOSERVER_CONFIG, createWfsGeoJsonUrl } from '../config/geoserver'
import type { FeatureCollection, Point } from 'geojson'
import type {
  DeparturePointCollection,
  DeparturePointProperties,
  DiveCenterCollection,
  DiveCenterProperties,
  DiveSiteCollection,
  DiveSiteProperties,
} from '../types/gis'

async function fetchPointLayer<Properties>(
  layerName: string,
  signal?: AbortSignal,
): Promise<FeatureCollection<Point, Properties>> {
  const response = await fetch(createWfsGeoJsonUrl(layerName), { signal })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as FeatureCollection<Point, Properties>

  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error('INVALID_GEOJSON')
  }

  return data
}

export async function fetchDiveSites(
  signal?: AbortSignal,
): Promise<DiveSiteCollection> {
  return fetchPointLayer<DiveSiteProperties>(
    GEOSERVER_CONFIG.layers.diveSites,
    signal,
  )
}

export async function fetchDiveCenters(
  signal?: AbortSignal,
): Promise<DiveCenterCollection> {
  return fetchPointLayer<DiveCenterProperties>(
    GEOSERVER_CONFIG.layers.diveCenters,
    signal,
  )
}

export async function fetchDeparturePoints(
  signal?: AbortSignal,
): Promise<DeparturePointCollection> {
  return fetchPointLayer<DeparturePointProperties>(
    GEOSERVER_CONFIG.layers.departurePoints,
    signal,
  )
}
