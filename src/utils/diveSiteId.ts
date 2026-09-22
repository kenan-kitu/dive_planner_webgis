import type { DiveSiteFeature } from '../types/gis'

export function getDiveSiteNumericId(site: DiveSiteFeature): number | null {
  if (typeof site.id === 'number') return site.id
  const match = String(site.id ?? '').match(/(\d+)$/)
  if (!match) return null
  const value = Number(match[1])
  return Number.isInteger(value) ? value : null
}
