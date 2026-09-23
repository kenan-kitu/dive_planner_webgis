import type { CommunityDiveSiteCollection } from '../types/gis'
import { apiUrl } from '../config/api'
import type { AuthUser, UserRole } from './auth'

export class PortalApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

async function request<T>(
  path: `/api/${string}`,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const response = await fetch(apiUrl(path), {
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
    throw new PortalApiError(
      payload?.detail ?? `Request failed (${response.status})`,
      response.status,
    )
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export interface DiveCenterProfileInput {
  business_name: string
  description: string | null
  phone: string | null
  website: string | null
  address: string | null
  longitude: number | null
  latitude: number | null
  agencies: string[]
  services: string[]
}

export interface DiveCenterProfile extends DiveCenterProfileInput {
  id: number
  user_id: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'

export interface DiveSiteSubmissionInput {
  name: string
  site_type: 'Reef' | 'Wreck' | 'Wall'
  min_depth_m: number | null
  max_depth_m: number | null
  description: string
  longitude: number
  latitude: number
}

export interface DiveSiteSubmission extends DiveSiteSubmissionInput {
  id: number
  submitted_by: number
  submitter_name: string
  business_name: string | null
  status: SubmissionStatus
  admin_note: string | null
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminDashboard {
  total_users: number
  dive_center_accounts: number
  comments: number
  pending_submissions: number
  approved_submissions: number
  rejected_submissions: number
  archived_submissions: number
}

export interface AdminUser extends AuthUser {
  created_at: string
  updated_at: string
}

export interface AdminDiveCenterProfile extends DiveCenterProfile {
  email: string
  display_name: string
}

export interface AdminComment {
  id: number
  user_id: number
  display_name: string
  role: UserRole
  dive_site_id: number
  dive_site_name: string
  body: string
  created_at: string
  updated_at: string
}

export function fetchCommunityDiveSites(
  signal?: AbortSignal,
): Promise<CommunityDiveSiteCollection> {
  return request('/api/community/dive-sites', { signal })
}

export async function getDiveCenterProfile(
  token: string,
): Promise<DiveCenterProfile | null> {
  try {
    return await request('/api/dive-center/profile', {}, token)
  } catch (error) {
    if (error instanceof PortalApiError && error.status === 404) return null
    throw error
  }
}

export function saveDiveCenterProfile(
  input: DiveCenterProfileInput,
  token: string,
): Promise<DiveCenterProfile> {
  return request(
    '/api/dive-center/profile',
    { method: 'PUT', body: JSON.stringify(input) },
    token,
  )
}

export function listDiveCenterSubmissions(
  token: string,
): Promise<DiveSiteSubmission[]> {
  return request('/api/dive-center/submissions', {}, token)
}

export function createDiveSiteSubmission(
  input: DiveSiteSubmissionInput,
  token: string,
): Promise<DiveSiteSubmission> {
  return request(
    '/api/dive-center/submissions',
    { method: 'POST', body: JSON.stringify(input) },
    token,
  )
}

export function updateDiveSiteSubmission(
  id: number,
  input: DiveSiteSubmissionInput,
  token: string,
): Promise<DiveSiteSubmission> {
  return request(
    `/api/dive-center/submissions/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
    token,
  )
}

export function deleteDiveSiteSubmission(id: number, token: string): Promise<void> {
  return request(`/api/dive-center/submissions/${id}`, { method: 'DELETE' }, token)
}

export function getAdminDashboard(token: string): Promise<AdminDashboard> {
  return request('/api/admin/dashboard', {}, token)
}

export function listAdminUsers(token: string): Promise<AdminUser[]> {
  return request('/api/admin/users', {}, token)
}

export function updateAdminUser(
  id: number,
  changes: { role?: 'USER' | 'DIVE_CENTER'; is_active?: boolean },
  token: string,
): Promise<AdminUser> {
  return request(
    `/api/admin/users/${id}`,
    { method: 'PATCH', body: JSON.stringify(changes) },
    token,
  )
}

export function listAdminDiveCenters(
  token: string,
): Promise<AdminDiveCenterProfile[]> {
  return request('/api/admin/dive-centers', {}, token)
}

export function setDiveCenterVerification(
  id: number,
  isVerified: boolean,
  token: string,
): Promise<AdminDiveCenterProfile> {
  return request(
    `/api/admin/dive-centers/${id}/verification`,
    { method: 'PATCH', body: JSON.stringify({ is_verified: isVerified }) },
    token,
  )
}

export function listAdminComments(token: string): Promise<AdminComment[]> {
  return request('/api/admin/comments', {}, token)
}

export function deleteAdminComment(id: number, token: string): Promise<void> {
  return request(`/api/comments/${id}`, { method: 'DELETE' }, token)
}

export function listAdminSubmissions(
  token: string,
): Promise<DiveSiteSubmission[]> {
  return request('/api/admin/submissions', {}, token)
}

export function reviewSubmission(
  id: number,
  decision: 'approve' | 'reject',
  adminNote: string,
  token: string,
): Promise<DiveSiteSubmission> {
  return request(
    `/api/admin/submissions/${id}/${decision}`,
    { method: 'POST', body: JSON.stringify({ admin_note: adminNote || null }) },
    token,
  )
}

export function archiveSubmission(
  id: number,
  adminNote: string,
  token: string,
): Promise<DiveSiteSubmission> {
  return request(
    `/api/admin/submissions/${id}/archive`,
    { method: 'POST', body: JSON.stringify({ admin_note: adminNote || null }) },
    token,
  )
}
