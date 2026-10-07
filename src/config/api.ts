const configuredApiOrigin = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = configuredApiOrigin
  ? configuredApiOrigin.replace(/\/$/, '')
  : ''

export function apiUrl(path: `/api/${string}`): string {
  return `${API_BASE_URL}${path}`
}
