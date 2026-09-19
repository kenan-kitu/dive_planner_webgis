const GEOSERVER_BASE_URL = '/geoserver'

export const GEOSERVER_CONFIG = {
  baseUrl: GEOSERVER_BASE_URL,
  workspace: 'diveplanner',
  layers: {
    diveSites: 'dive_sites',
    diveCenters: 'dive_centers_clean',
    departurePoints: 'departure_points_clean',
  },
} as const

export function createWfsGeoJsonUrl(layerName: string): string {
  const { baseUrl, workspace } = GEOSERVER_CONFIG
  const params = new URLSearchParams({
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    typeName: `${workspace}:${layerName}`,
    outputFormat: 'application/json',
  })

  return `${baseUrl}/${workspace}/ows?${params.toString()}`
}
