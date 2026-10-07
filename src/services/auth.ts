import { apiUrl } from '../config/api'

export type UserRole = 'USER' | 'DIVE_CENTER' | 'ADMIN'

export interface AuthUser {
  id: number
  email: string
  display_name: string
  role: UserRole
  is_active: boolean
}

export interface LoginResponse {
  user: AuthUser
}

export interface RegisterInput {
  email: string
  password: string
  display_name: string
}

async function request<T>(
  path: `/api/${string}`,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string
    } | null
    throw new Error(body?.detail ?? `Request failed (${response.status})`)
  }

  return (await response.json()) as T
}

export function registerAccount(input: RegisterInput): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function loginAccount(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/me')
}

export function logoutAccount(): Promise<void> {
  return request<void>('/api/auth/logout', { method: 'POST' })
}
