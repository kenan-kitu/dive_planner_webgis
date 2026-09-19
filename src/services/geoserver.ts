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

const RETRY_DELAYS_MS = [2_000, 4_000, 8_000, 12_000] as const

class GeoServerRequestError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message)
    this.name = 'GeoServerRequestError'
  }
}

function waitForRetry(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }

    const handleAbort = () => {
      window.clearTimeout(timeoutId)
      reject(signal?.reason)
    }
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, delayMs)

    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

function isRetryableError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof GeoServerRequestError && error.retryable)
  )
}

async function fetchPointLayer<Properties>(
  layerName: string,
  signal?: AbortSignal,
): Promise<FeatureCollection<Point, Properties>> {
  const url = createWfsGeoJsonUrl(layerName)

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(url, { signal })

      if (!response.ok) {
        throw new GeoServerRequestError(
          `${response.status} ${response.statusText}`,
          response.status === 408 ||
            response.status === 429 ||
            response.status >= 500,
        )
      }

      const data = (await response.json()) as FeatureCollection<
        Point,
        Properties
      >

      if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new GeoServerRequestError('INVALID_GEOJSON', false)
      }

      return data
    } catch (error) {
      if (
        signal?.aborted ||
        attempt === RETRY_DELAYS_MS.length ||
        !isRetryableError(error)
      ) {
        throw error
      }

      await waitForRetry(RETRY_DELAYS_MS[attempt], signal)
    }
  }

  throw new Error('UNKNOWN_ERROR')
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
