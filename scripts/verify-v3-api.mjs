const origin = process.env.V3_TEST_ORIGIN ?? 'http://127.0.0.1:8787'
const bootstrapSecret = process.env.V3_TEST_BOOTSTRAP_SECRET
const adminEmail = process.env.V3_TEST_ADMIN_EMAIL
const adminPassword = process.env.V3_TEST_ADMIN_PASSWORD
if (!bootstrapSecret || !adminEmail || !adminPassword) {
  throw new Error('Set V3_TEST_BOOTSTRAP_SECRET, V3_TEST_ADMIN_EMAIL and V3_TEST_ADMIN_PASSWORD.')
}

let userCookie = ''
let adminCookie = ''
const suffix = Date.now()
const userEmail = `v3-test-${suffix}@diveplanner.dev`
const userPassword = `LocalTest${suffix}Aa1`

async function call(path, { method = 'GET', payload, cookie = '', headers = {}, omitOrigin = false } = {}) {
  const response = await fetch(`${origin}${path}`, {
    method,
    headers: {
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
      ...(!omitOrigin && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? { Origin: origin } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: payload ? JSON.stringify(payload) : undefined,
    redirect: 'manual',
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  return { response, data }
}

function expect(condition, label) {
  if (!condition) throw new Error(`FAIL ${label}`)
  console.log(`PASS ${label}`)
}

let result = await call('/api/health')
expect(result.response.ok && result.data.database === 'D1', 'D1 health')

result = await call('/api/admin/bootstrap', {
  method: 'POST',
  payload: { email: adminEmail, password: adminPassword, display_name: 'Local V3 Admin' },
  headers: { 'X-Bootstrap-Secret': bootstrapSecret },
})
expect(
  result.response.status === 201 || result.response.status === 409,
  `one-time admin bootstrap (${result.response.status}: ${result.data?.detail ?? 'no detail'})`,
)

result = await call('/api/auth/login', { method: 'POST', payload: { email: adminEmail, password: adminPassword } })
expect(result.response.ok && result.data.user.role === 'ADMIN', 'ADMIN login')
adminCookie = result.response.headers.get('set-cookie')?.split(';')[0] ?? ''

result = await call('/api/auth/register', { method: 'POST', payload: { email: userEmail, password: userPassword, display_name: 'V3 Test Diver' } })
expect(result.response.status === 201 && result.data.role === 'USER', 'USER registration')
const userId = result.data.id
result = await call('/api/auth/register', { method: 'POST', omitOrigin: true, payload: { email: `csrf-${userEmail}`, password: userPassword, display_name: 'Rejected' } })
expect(result.response.status === 403, 'cross-origin write rejected')

result = await call('/api/auth/login', { method: 'POST', payload: { email: userEmail, password: userPassword } })
expect(result.response.ok && result.data.user.role === 'USER', 'USER login')
userCookie = result.response.headers.get('set-cookie')?.split(';')[0] ?? ''
result = await call('/api/auth/me', { cookie: userCookie })
expect(result.response.ok && result.data.email === userEmail, 'HttpOnly session and /me')
result = await call('/api/admin/dashboard', { cookie: userCookie })
expect(result.response.status === 403, 'USER blocked from ADMIN')
result = await call('/api/dive-center/profile', { cookie: userCookie })
expect(result.response.status === 403, 'USER blocked from Dive Center management')

result = await call(`/api/admin/users/${userId}`, { method: 'PATCH', cookie: adminCookie, payload: { role: 'DIVE_CENTER' } })
expect(result.response.ok && result.data.role === 'DIVE_CENTER', 'ADMIN promotes USER to DIVE_CENTER')
result = await call('/api/dive-center/profile', {
  method: 'PUT', cookie: userCookie,
  payload: { business_name: 'V3 Test Center', description: 'Local validation profile', phone: null, website: null, address: 'Florida Keys', longitude: -81.8, latitude: 24.55, agencies: ['PADI'], services: ['Boat diving'] },
})
expect(result.response.ok && result.data.business_name === 'V3 Test Center', 'Dive Center profile')

result = await call('/api/dive-sites/1/comments', { method: 'POST', cookie: userCookie, payload: { body: 'Local V3 validation comment' } })
expect(result.response.status === 201, 'comment')
result = await call('/api/dive-sites/1/rating', { method: 'PUT', cookie: userCookie, payload: { rating: 5 } })
expect(result.response.ok && result.data.current_user_rating === 5, 'rating')
result = await call('/api/dive-sites/1/favorite', { method: 'POST', cookie: userCookie })
expect(result.response.ok && result.data.favorited, 'favorite')

result = await call('/api/dive-center/submissions', {
  method: 'POST', cookie: userCookie,
  payload: { name: 'Invalid Coordinates', site_type: 'Reef', description: 'This input must be rejected safely.', longitude: 999, latitude: 24.6 },
})
expect(result.response.status === 422, 'invalid coordinates rejected')
result = await call('/api/dive-center/submissions', {
  method: 'POST', cookie: userCookie,
  payload: { name: 'V3 Validation Reef', site_type: 'Reef', min_depth_m: 8, max_depth_m: 22, description: 'Temporary serverless workflow validation site.', longitude: -81.7, latitude: 24.6 },
})
expect(result.response.status === 201 && result.data.status === 'PENDING', 'submission PENDING')
const submissionId = result.data.id
result = await call('/api/community/dive-sites')
expect(!result.data.features.some((feature) => feature.properties.id === submissionId), 'PENDING hidden publicly')
result = await call(`/api/admin/submissions/${submissionId}/approve`, { method: 'POST', cookie: adminCookie, payload: { admin_note: 'Local test approval' } })
expect(result.response.ok && result.data.status === 'APPROVED', 'ADMIN approve')
result = await call('/api/community/dive-sites')
expect(result.data.features.some((feature) => feature.properties.id === submissionId), 'APPROVED visible publicly')
result = await call(`/api/admin/submissions/${submissionId}/archive`, { method: 'POST', cookie: adminCookie, payload: { admin_note: 'Local test cleanup' } })
expect(result.response.ok && result.data.status === 'ARCHIVED', 'ADMIN archive')
result = await call('/api/community/dive-sites')
expect(!result.data.features.some((feature) => feature.properties.id === submissionId), 'ARCHIVED hidden publicly')

result = await call('/api/auth/logout', { method: 'POST', cookie: userCookie })
expect(result.response.status === 204, 'logout')
