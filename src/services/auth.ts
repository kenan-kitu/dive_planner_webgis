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
  access_token: string
  token_type: 'bearer'
  expires_in: number
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
  token?: string,
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

export function getCurrentUser(token: string): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/me', {}, token)
}
