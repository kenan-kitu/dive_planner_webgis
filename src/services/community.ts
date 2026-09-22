import type { DiveSiteCollection } from '../types/gis'
import type { UserRole } from './auth'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export interface CommunityComment {
  id: number
  user_id: number
  display_name: string
  role: UserRole
  body: string
  created_at: string
  updated_at: string
}

export interface RatingSummary {
  average_rating: number | null
  rating_count: number
  current_user_rating: number | null
}

interface FavoriteStatus {
  favorited: boolean
}

async function communityRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      detail?: string
    } | null
    throw new Error(payload?.detail ?? `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function listComments(siteId: number): Promise<CommunityComment[]> {
  return communityRequest(`/api/dive-sites/${siteId}/comments`)
}

export function createComment(
  siteId: number,
  body: string,
  token: string,
): Promise<CommunityComment> {
  return communityRequest(
    `/api/dive-sites/${siteId}/comments`,
    { method: 'POST', body: JSON.stringify({ body }) },
    token,
  )
}

export function updateComment(
  commentId: number,
  body: string,
  token: string,
): Promise<CommunityComment> {
  return communityRequest(
    `/api/comments/${commentId}`,
    { method: 'PATCH', body: JSON.stringify({ body }) },
    token,
  )
}

export function deleteComment(commentId: number, token: string): Promise<void> {
  return communityRequest(
    `/api/comments/${commentId}`,
    { method: 'DELETE' },
    token,
  )
}

export function getRating(siteId: number, token?: string | null): Promise<RatingSummary> {
  return communityRequest(`/api/dive-sites/${siteId}/rating`, {}, token)
}

export function setRating(
  siteId: number,
  rating: number,
  token: string,
): Promise<RatingSummary> {
  return communityRequest(
    `/api/dive-sites/${siteId}/rating`,
    { method: 'PUT', body: JSON.stringify({ rating }) },
    token,
  )
}

export function removeRating(siteId: number, token: string): Promise<void> {
  return communityRequest(
    `/api/dive-sites/${siteId}/rating`,
    { method: 'DELETE' },
    token,
  )
}

export function getFavoriteStatus(siteId: number, token: string): Promise<FavoriteStatus> {
  return communityRequest(`/api/dive-sites/${siteId}/favorite-status`, {}, token)
}

export function addFavorite(siteId: number, token: string): Promise<FavoriteStatus> {
  return communityRequest(
    `/api/dive-sites/${siteId}/favorite`,
    { method: 'POST' },
    token,
  )
}

export function removeFavorite(siteId: number, token: string): Promise<FavoriteStatus> {
  return communityRequest(
    `/api/dive-sites/${siteId}/favorite`,
    { method: 'DELETE' },
    token,
  )
}

export function listFavorites(token: string): Promise<DiveSiteCollection> {
  return communityRequest('/api/account/favorites', {}, token)
}
