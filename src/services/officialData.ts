import type { FeatureCollection, Point } from 'geojson'
import type {
  DeparturePointCollection,
  DeparturePointProperties,
  DiveCenterCollection,
  DiveCenterProperties,
  DiveSiteCollection,
  DiveSiteProperties,
} from '../types/gis'

const DATA_FILES = {
  diveSites: '/data/dive_sites.geojson',
  diveCenters: '/data/dive_centers.geojson',
  departurePoints: '/data/departure_points.geojson',
} as const

async function fetchPointLayer<Properties>(
  url: string,
  signal?: AbortSignal,
): Promise<FeatureCollection<Point, Properties>> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`OFFICIAL_DATA_REQUEST_FAILED_${response.status}`)
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
    DATA_FILES.diveSites,
    signal,
  )
}

export async function fetchDiveCenters(
  signal?: AbortSignal,
): Promise<DiveCenterCollection> {
  return fetchPointLayer<DiveCenterProperties>(
    DATA_FILES.diveCenters,
    signal,
  )
}

export async function fetchDeparturePoints(
  signal?: AbortSignal,
): Promise<DeparturePointCollection> {
  return fetchPointLayer<DeparturePointProperties>(
    DATA_FILES.departurePoints,
    signal,
  )
}


