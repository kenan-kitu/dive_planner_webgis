import { pbkdf2Sync, timingSafeEqual } from 'node:crypto'
import { AUTH_PASSWORD_POLICY, meetsPasswordPolicy } from '../src/config/authPolicy.ts'

const ITERATIONS = 100_000
const SESSION_SECONDS = 43_200
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://server.arcgisonline.com https://tile.openstreetmap.org https://tiles.openseamap.org https://floridakeys.noaa.gov https://upload.wikimedia.org https://thumb.wikimedia.org https://silentworld.com https://conchrepublicdivers.com https://floridakeysdivecenter.com https://captainhooks.com https://img1.wsimg.com https://static.wixstatic.com https://www.scubatechkeylargo.com https://divekeywest.com https://lostreefadventures.com https://www.snorkelingisfun.com https://dlsmyzcs6vrg4.cloudfront.net https://i.vimeocdn.com; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'self' blob:",
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

class ApiError extends Error {
  constructor(status, detail) { super(detail); this.status = status; this.detail = detail }
}
const now = () => new Date().toISOString()
const boolean = (value) => Boolean(Number(value))
const fail = (condition, status, detail) => { if (condition) throw new ApiError(status, detail) }

function json(payload, status = 200, headers = {}) {
  return new Response(payload === undefined ? null : JSON.stringify(payload), {
    status, headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })
}
function secure(response) {
  const copy = new Response(response.body, response)
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => copy.headers.set(key, value))
  return copy
}
async function readBody(request, allowed, required = []) {
  fail(Number(request.headers.get('content-length') || 0) > 24_000, 413, 'Request body is too large.')
  let value
  try { value = await request.json() } catch { throw new ApiError(400, 'Invalid JSON body.') }
  fail(!value || typeof value !== 'object' || Array.isArray(value), 400, 'Invalid request body.')
  Object.keys(value).forEach((key) => fail(!allowed.includes(key), 400, `Unexpected field: ${key}`))
  required.forEach((key) => fail(value[key] === undefined, 400, `Missing field: ${key}`))
  return value
}
function cleanText(value, field, min, max, nullable = false) {
  if (nullable && (value === null || value === '')) return null
  fail(typeof value !== 'string', 422, `${field} must be text.`)
  const result = value.trim(); fail(result.length < min || result.length > max, 422, `${field} has an invalid length.`); return result
}
function validEmail(value) {
  const result = cleanText(value, 'email', 5, 254).toLowerCase()
  fail(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result), 422, 'Invalid email address.'); return result
}
function validPassword(value) {
  const result = cleanText(value, 'password', AUTH_PASSWORD_POLICY.minLength, AUTH_PASSWORD_POLICY.maxLength)
  fail(!meetsPasswordPolicy(result), 422, 'Password must include upper-case, lower-case and numeric characters.'); return result
}
function numeric(value, field, min, max, nullable = false) {
  if (nullable && (value === null || value === '')) return null
  const result = Number(value); fail(!Number.isFinite(result) || result < min || result > max, 422, `${field} is outside the allowed range.`); return result
}
function list(value, field) {
  fail(!Array.isArray(value) || value.length > 20, 422, `${field} must be a short list.`)
  return value.map((item) => cleanText(item, field, 1, 80))
}
function b64(bytes) { let text = ''; bytes.forEach((byte) => { text += String.fromCharCode(byte) }); return btoa(text) }
function unb64(value) { return Uint8Array.from(atob(value), (character) => character.charCodeAt(0)) }
async function sha(value) { return b64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))) }
async function derive(raw, salt, iterations = ITERATIONS) { return pbkdf2Sync(raw, salt, iterations, 32, 'sha256') }
async function hashPassword(raw) { const salt = crypto.getRandomValues(new Uint8Array(16)); return { hash: b64(await derive(raw, salt)), salt: b64(salt) } }
async function checkPassword(raw, user) {
  const actual = await derive(raw, unb64(user.password_salt), user.password_iterations); const expected = unb64(user.password_hash)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
function equal(left, right) {
  const a = String(left || ''), b = String(right || ''); let difference = a.length ^ b.length
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0)
  return difference === 0
}
function cookie(request, name) {
  for (const part of (request.headers.get('cookie') || '').split(';')) { const [key, ...rest] = part.trim().split('='); if (key === name) return rest.join('=') }
  return null
}
function userJson(row) { return { id: row.id, email: row.email, display_name: row.display_name, role: row.role, is_active: boolean(row.is_active), ...(row.created_at ? { created_at: row.created_at, updated_at: row.updated_at } : {}) } }
async function getUser(request, env) {
  const token = cookie(request, 'dp_session'); if (!token) return null
  const row = await env.DB.prepare(`SELECT u.id,u.email,u.display_name,u.role,u.is_active,u.created_at,u.updated_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.is_active=1`).bind(await sha(token), now()).first()
  return row ? userJson(row) : null
}
async function requireUser(request, env, roles = null) {
  const user = await getUser(request, env); fail(!user, 401, 'Authentication required.'); fail(roles && !roles.includes(user.role), 403, 'Not authorized for this action.'); return user
}
function sameOrigin(request) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return
  const origin = request.headers.get('origin'); fail(!origin || origin !== new URL(request.url).origin, 403, 'Invalid request origin.')
}
async function rateLimit(env, action, request, limit, seconds, identity = '') {
  const bucket = Math.floor(Date.now() / (seconds * 1000)), key = `${action}:${request.headers.get('CF-Connecting-IP') || 'unknown'}:${identity}:${bucket}`
  await env.DB.prepare(`INSERT INTO rate_limits(key,count,expires_at,updated_at) VALUES(?,1,?,?) ON CONFLICT(key) DO UPDATE SET count=count+1,updated_at=excluded.updated_at`).bind(key, new Date((bucket + 1) * seconds * 1000).toISOString(), now()).run()
  const row = await env.DB.prepare('SELECT count FROM rate_limits WHERE key=?').bind(key).first(); fail(Number(row?.count || 0) > limit, 429, 'Too many requests. Please try again later.')
}
async function newSession(env, userId) {
  const raw = b64(crypto.getRandomValues(new Uint8Array(32))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''), timestamp = now()
  await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await sha(raw), userId, new Date(Date.now() + SESSION_SECONDS * 1000).toISOString(), timestamp).run(); return raw
}
async function asset(env, name) {
  const response = await env.ASSETS.fetch(new Request(`https://assets.invalid/data/${name}`)); fail(!response.ok, 503, 'Official data is unavailable.'); return response.json()
}
async function validateSite(env, siteId) {
  const collection = await asset(env, 'dive_sites.geojson'), ids = new Set(collection.features.map((feature) => Number(feature.id ?? feature.properties?.fid)))
  fail(!ids.has(siteId), 404, 'Dive site not found.')
}
function parseList(value) { try { return JSON.parse(value || '[]') } catch { return [] } }
function profileJson(row) { return { ...row, is_verified: boolean(row.is_verified), agencies: parseList(row.agencies), services: parseList(row.services) } }
const SUBMISSION_SELECT = `SELECT s.*,u.display_name AS submitter_name,p.business_name FROM dive_site_submissions s JOIN users u ON u.id=s.submitted_by LEFT JOIN dive_center_profiles p ON p.user_id=s.submitted_by`
async function submission(env, id) { const row = await env.DB.prepare(`${SUBMISSION_SELECT} WHERE s.id=?`).bind(id).first(); fail(!row, 404, 'Submission not found.'); return row }

function validateProfile(input) {
  const longitude = numeric(input.longitude, 'longitude', -180, 180, true), latitude = numeric(input.latitude, 'latitude', -90, 90, true)
  fail((longitude === null) !== (latitude === null), 422, 'Latitude and longitude must be provided together.')
  const website = cleanText(input.website, 'website', 0, 300, true)
  if (website) { let parsed; try { parsed = new URL(website) } catch { throw new ApiError(422, 'Website is invalid.') }; fail(!['http:', 'https:'].includes(parsed.protocol), 422, 'Website must use HTTP or HTTPS.') }
  return { business_name: cleanText(input.business_name, 'business_name', 2, 160), description: cleanText(input.description, 'description', 0, 2000, true), phone: cleanText(input.phone, 'phone', 0, 40, true), website, address: cleanText(input.address, 'address', 0, 300, true), longitude, latitude, agencies: list(input.agencies, 'agencies'), services: list(input.services, 'services') }
}
function validateSubmission(input) {
  const siteType = cleanText(input.site_type, 'site_type', 2, 20); fail(!['Reef', 'Wreck', 'Wall'].includes(siteType), 422, 'Invalid site type.')
  const min = numeric(input.min_depth_m, 'min_depth_m', 0, 200, true), max = numeric(input.max_depth_m, 'max_depth_m', 0, 200, true); fail(min !== null && max !== null && min > max, 422, 'Minimum depth cannot exceed maximum depth.')
  return { name: cleanText(input.name, 'name', 2, 160), site_type: siteType, min_depth_m: min, max_depth_m: max, description: cleanText(input.description, 'description', 10, 3000), longitude: numeric(input.longitude, 'longitude', -180, 180), latitude: numeric(input.latitude, 'latitude', -90, 90) }
}

async function authRoutes(request, env, path) {
  if (path === '/api/auth/register' && request.method === 'POST') {
    await rateLimit(env, 'register', request, 5, 3600); const input = await readBody(request, ['email', 'password', 'display_name'], ['email', 'password', 'display_name']), email = validEmail(input.email)
    fail(await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first(), 409, 'An account with this email already exists.')
    const secured = await hashPassword(validPassword(input.password)), timestamp = now()
    const result = await env.DB.prepare(`INSERT INTO users(email,password_hash,password_salt,password_iterations,display_name,role,is_active,created_at,updated_at) VALUES(?,?,?,?,?,'USER',1,?,?)`).bind(email, secured.hash, secured.salt, ITERATIONS, cleanText(input.display_name, 'display_name', 2, 100), timestamp, timestamp).run()
    return json(userJson(await env.DB.prepare('SELECT id,email,display_name,role,is_active FROM users WHERE id=?').bind(result.meta.last_row_id).first()), 201)
  }
  if (path === '/api/auth/login' && request.method === 'POST') {
    const input = await readBody(request, ['email', 'password'], ['email', 'password']), identity = typeof input.email === 'string' ? input.email.trim().toLowerCase().slice(0, 254) : ''
    await rateLimit(env, 'login', request, 10, 600, identity); const row = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(identity).first()
    fail(!(row && boolean(row.is_active) && await checkPassword(String(input.password || ''), row)), 401, 'Invalid email or password.')
    const token = await newSession(env, row.id); return json({ user: userJson(row) }, 200, { 'Set-Cookie': `dp_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}` })
  }
  if (path === '/api/auth/logout' && request.method === 'POST') {
    const token = cookie(request, 'dp_session'); if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha(token)).run()
    return json(undefined, 204, { 'Set-Cookie': 'dp_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0' })
  }
  if (path === '/api/auth/me' && request.method === 'GET') return json(await requireUser(request, env))
  if (path === '/api/account/profile' && request.method === 'GET') return json(await requireUser(request, env))
  if (path === '/api/dive-center/dashboard' && request.method === 'GET') {
    const user = await requireUser(request, env, ['DIVE_CENTER']), rows = await env.DB.prepare('SELECT status,COUNT(*) count FROM dive_site_submissions WHERE submitted_by=? GROUP BY status').bind(user.id).all()
    return json({ user, submission_counts: Object.fromEntries(rows.results.map((row) => [row.status, Number(row.count)])) })
  }
  if (path === '/api/admin/status' && request.method === 'GET') return json({ user: await requireUser(request, env, ['ADMIN']), status: 'authorized' })
  return null
}

async function communityRoutes(request, env, path) {
  let match = path.match(/^\/api\/dive-sites\/(\d+)\/comments$/)
  if (match) {
    const siteId = Number(match[1]); await validateSite(env, siteId)
    if (request.method === 'GET') { const rows = await env.DB.prepare('SELECT c.id,c.user_id,u.display_name,u.role,c.body,c.created_at,c.updated_at FROM comments c JOIN users u ON u.id=c.user_id WHERE c.dive_site_id=? ORDER BY c.created_at DESC').bind(siteId).all(); return json(rows.results) }
    if (request.method === 'POST') {
      const user = await requireUser(request, env), input = await readBody(request, ['body'], ['body']), timestamp = now()
      const result = await env.DB.prepare('INSERT INTO comments(user_id,dive_site_id,body,created_at,updated_at) VALUES(?,?,?,?,?)').bind(user.id, siteId, cleanText(input.body, 'body', 1, 1000), timestamp, timestamp).run()
      return json(await env.DB.prepare('SELECT c.id,c.user_id,u.display_name,u.role,c.body,c.created_at,c.updated_at FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?').bind(result.meta.last_row_id).first(), 201)
    }
  }
  match = path.match(/^\/api\/comments\/(\d+)$/)
  if (match && ['PATCH', 'DELETE'].includes(request.method)) {
    const user = await requireUser(request, env), id = Number(match[1]), existing = await env.DB.prepare('SELECT * FROM comments WHERE id=?').bind(id).first()
    fail(!existing, 404, 'Comment not found.'); fail(user.role !== 'ADMIN' && existing.user_id !== user.id, 403, 'Not authorized for this action.')
    if (request.method === 'DELETE') { await env.DB.prepare('DELETE FROM comments WHERE id=?').bind(id).run(); return json(undefined, 204) }
    const input = await readBody(request, ['body'], ['body']); await env.DB.prepare('UPDATE comments SET body=?,updated_at=? WHERE id=?').bind(cleanText(input.body, 'body', 1, 1000), now(), id).run()
    return json(await env.DB.prepare('SELECT c.id,c.user_id,u.display_name,u.role,c.body,c.created_at,c.updated_at FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?').bind(id).first())
  }
  match = path.match(/^\/api\/dive-sites\/(\d+)\/rating$/)
  if (match) {
    const siteId = Number(match[1]); await validateSite(env, siteId); const current = await getUser(request, env)
    const summary = async () => { const total = await env.DB.prepare('SELECT AVG(rating) average_rating,COUNT(*) rating_count FROM ratings WHERE dive_site_id=?').bind(siteId).first(), own = current ? await env.DB.prepare('SELECT rating FROM ratings WHERE dive_site_id=? AND user_id=?').bind(siteId, current.id).first() : null; return { average_rating: total.average_rating === null ? null : Number(total.average_rating), rating_count: Number(total.rating_count), current_user_rating: own ? Number(own.rating) : null } }
    if (request.method === 'GET') return json(await summary())
    const user = await requireUser(request, env)
    if (request.method === 'PUT') { const input = await readBody(request, ['rating'], ['rating']), rating = numeric(input.rating, 'rating', 1, 5); fail(!Number.isInteger(rating), 422, 'Rating must be an integer.'); const timestamp = now(); await env.DB.prepare('INSERT INTO ratings(user_id,dive_site_id,rating,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,dive_site_id) DO UPDATE SET rating=excluded.rating,updated_at=excluded.updated_at').bind(user.id, siteId, rating, timestamp, timestamp).run(); return json(await summary()) }
    if (request.method === 'DELETE') { await env.DB.prepare('DELETE FROM ratings WHERE user_id=? AND dive_site_id=?').bind(user.id, siteId).run(); return json(undefined, 204) }
  }
  match = path.match(/^\/api\/dive-sites\/(\d+)\/favorite(?:-status)?$/)
  if (match) {
    const user = await requireUser(request, env), siteId = Number(match[1]); await validateSite(env, siteId)
    if (request.method === 'GET') return json({ favorited: Boolean(await env.DB.prepare('SELECT 1 found FROM favorites WHERE user_id=? AND dive_site_id=?').bind(user.id, siteId).first()) })
    if (request.method === 'POST') { await env.DB.prepare('INSERT OR IGNORE INTO favorites(user_id,dive_site_id,created_at) VALUES(?,?,?)').bind(user.id, siteId, now()).run(); return json({ favorited: true }) }
    if (request.method === 'DELETE') { await env.DB.prepare('DELETE FROM favorites WHERE user_id=? AND dive_site_id=?').bind(user.id, siteId).run(); return json({ favorited: false }) }
  }
  if (path === '/api/account/favorites' && request.method === 'GET') {
    const user = await requireUser(request, env), rows = await env.DB.prepare('SELECT dive_site_id FROM favorites WHERE user_id=?').bind(user.id).all(), ids = new Set(rows.results.map((row) => Number(row.dive_site_id))), collection = await asset(env, 'dive_sites.geojson')
    return json({ ...collection, features: collection.features.filter((feature) => ids.has(Number(feature.id ?? feature.properties?.fid))) })
  }
  return null
}

async function centerRoutes(request, env, path) {
  if (path === '/api/dive-center/profile') {
    const user = await requireUser(request, env, ['DIVE_CENTER'])
    if (request.method === 'GET') { const row = await env.DB.prepare('SELECT * FROM dive_center_profiles WHERE user_id=?').bind(user.id).first(); fail(!row, 404, 'Dive center profile not found.'); return json(profileJson(row)) }
    if (['PUT', 'PATCH'].includes(request.method)) {
      const input = await readBody(request, ['business_name', 'description', 'phone', 'website', 'address', 'longitude', 'latitude', 'agencies', 'services'], ['business_name', 'agencies', 'services']), value = validateProfile(input), timestamp = now()
      await env.DB.prepare(`INSERT INTO dive_center_profiles(user_id,business_name,description,phone,website,address,longitude,latitude,agencies,services,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET business_name=excluded.business_name,description=excluded.description,phone=excluded.phone,website=excluded.website,address=excluded.address,longitude=excluded.longitude,latitude=excluded.latitude,agencies=excluded.agencies,services=excluded.services,updated_at=excluded.updated_at`).bind(user.id, value.business_name, value.description, value.phone, value.website, value.address, value.longitude, value.latitude, JSON.stringify(value.agencies), JSON.stringify(value.services), timestamp, timestamp).run()
      return json(profileJson(await env.DB.prepare('SELECT * FROM dive_center_profiles WHERE user_id=?').bind(user.id).first()))
    }
  }
  if (path === '/api/dive-center/submissions') {
    const user = await requireUser(request, env, ['DIVE_CENTER'])
    if (request.method === 'GET') { const rows = await env.DB.prepare(`${SUBMISSION_SELECT} WHERE s.submitted_by=? ORDER BY s.created_at DESC`).bind(user.id).all(); return json(rows.results) }
    if (request.method === 'POST') {
      await rateLimit(env, 'submission', request, 10, 3600, String(user.id)); const input = await readBody(request, ['name', 'site_type', 'min_depth_m', 'max_depth_m', 'description', 'longitude', 'latitude'], ['name', 'site_type', 'description', 'longitude', 'latitude']), value = validateSubmission(input), timestamp = now()
      const result = await env.DB.prepare("INSERT INTO dive_site_submissions(submitted_by,name,site_type,min_depth_m,max_depth_m,description,longitude,latitude,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'PENDING',?,?)").bind(user.id, value.name, value.site_type, value.min_depth_m, value.max_depth_m, value.description, value.longitude, value.latitude, timestamp, timestamp).run(); return json(await submission(env, result.meta.last_row_id), 201)
    }
  }
  const match = path.match(/^\/api\/dive-center\/submissions\/(\d+)$/)
  if (match && ['GET', 'PATCH', 'DELETE'].includes(request.method)) {
    const user = await requireUser(request, env, ['DIVE_CENTER']), id = Number(match[1]), existing = await submission(env, id); fail(existing.submitted_by !== user.id, 403, 'Not authorized for this submission.')
    if (request.method === 'GET') return json(existing); fail(existing.status !== 'PENDING', 409, 'Approved sites must be removed by an administrator.')
    if (request.method === 'DELETE') { await env.DB.prepare('DELETE FROM dive_site_submissions WHERE id=?').bind(id).run(); return json(undefined, 204) }
    const input = await readBody(request, ['name', 'site_type', 'min_depth_m', 'max_depth_m', 'description', 'longitude', 'latitude'], ['name', 'site_type', 'description', 'longitude', 'latitude']), value = validateSubmission(input)
    await env.DB.prepare('UPDATE dive_site_submissions SET name=?,site_type=?,min_depth_m=?,max_depth_m=?,description=?,longitude=?,latitude=?,updated_at=? WHERE id=?').bind(value.name, value.site_type, value.min_depth_m, value.max_depth_m, value.description, value.longitude, value.latitude, now(), id).run(); return json(await submission(env, id))
  }
  return null
}

async function adminRoutes(request, env, path) {
  if (path === '/api/admin/bootstrap' && request.method === 'POST') {
    fail(!env.ADMIN_BOOTSTRAP_SECRET, 404, 'Not found.'); await rateLimit(env, 'bootstrap', request, 5, 3600); fail(!equal(request.headers.get('X-Bootstrap-Secret'), env.ADMIN_BOOTSTRAP_SECRET), 403, 'Not authorized.')
    fail(await env.DB.prepare("SELECT id FROM users WHERE role='ADMIN' LIMIT 1").first(), 409, 'Initial administrator already exists.')
    const input = await readBody(request, ['email', 'password', 'display_name'], ['email', 'password', 'display_name']), secured = await hashPassword(validPassword(input.password)), timestamp = now()
    const result = await env.DB.prepare("INSERT INTO users(email,password_hash,password_salt,password_iterations,display_name,role,is_active,created_at,updated_at) VALUES(?,?,?,?,?,'ADMIN',1,?,?)").bind(validEmail(input.email), secured.hash, secured.salt, ITERATIONS, cleanText(input.display_name, 'display_name', 2, 100), timestamp, timestamp).run(); return json(userJson(await env.DB.prepare('SELECT id,email,display_name,role,is_active FROM users WHERE id=?').bind(result.meta.last_row_id).first()), 201)
  }
  if (!path.startsWith('/api/admin/')) return null
  const admin = await requireUser(request, env, ['ADMIN'])
  if (path === '/api/admin/dashboard' && request.method === 'GET') {
    const sql = ['SELECT COUNT(*) n FROM users', "SELECT COUNT(*) n FROM users WHERE role='DIVE_CENTER'", 'SELECT COUNT(*) n FROM comments', "SELECT COUNT(*) n FROM dive_site_submissions WHERE status='PENDING'", "SELECT COUNT(*) n FROM dive_site_submissions WHERE status='APPROVED'", "SELECT COUNT(*) n FROM dive_site_submissions WHERE status='REJECTED'", "SELECT COUNT(*) n FROM dive_site_submissions WHERE status='ARCHIVED'"]
    const values = (await env.DB.batch(sql.map((query) => env.DB.prepare(query)))).map((result) => Number(result.results[0]?.n || 0)); return json({ total_users: values[0], dive_center_accounts: values[1], comments: values[2], pending_submissions: values[3], approved_submissions: values[4], rejected_submissions: values[5], archived_submissions: values[6] })
  }
  if (path === '/api/admin/users' && request.method === 'GET') { const rows = await env.DB.prepare('SELECT id,email,display_name,role,is_active,created_at,updated_at FROM users ORDER BY created_at DESC').all(); return json(rows.results.map(userJson)) }
  let match = path.match(/^\/api\/admin\/users\/(\d+)$/)
  if (match && request.method === 'PATCH') {
    const id = Number(match[1]); fail(id === admin.id, 409, 'Administrators cannot change their own access here.'); const existing = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first(); fail(!existing, 404, 'User not found.'); fail(existing.role === 'ADMIN', 403, 'Other administrators cannot be changed here.')
    const input = await readBody(request, ['role', 'is_active']), role = input.role === undefined ? existing.role : cleanText(input.role, 'role', 4, 20); fail(!['USER', 'DIVE_CENTER'].includes(role), 422, 'Invalid role.')
    await env.DB.prepare('UPDATE users SET role=?,is_active=?,updated_at=? WHERE id=?').bind(role, input.is_active === undefined ? existing.is_active : input.is_active ? 1 : 0, now(), id).run(); return json(userJson(await env.DB.prepare('SELECT id,email,display_name,role,is_active,created_at,updated_at FROM users WHERE id=?').bind(id).first()))
  }
  if (path === '/api/admin/dive-centers' && request.method === 'GET') { const rows = await env.DB.prepare('SELECT p.*,u.email,u.display_name FROM dive_center_profiles p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC').all(); return json(rows.results.map(profileJson)) }
  match = path.match(/^\/api\/admin\/dive-centers\/(\d+)\/verification$/)
  if (match && request.method === 'PATCH') { const id = Number(match[1]), input = await readBody(request, ['is_verified'], ['is_verified']), result = await env.DB.prepare('UPDATE dive_center_profiles SET is_verified=?,updated_at=? WHERE id=?').bind(input.is_verified ? 1 : 0, now(), id).run(); fail(!result.meta.changes, 404, 'Dive center profile not found.'); return json(profileJson(await env.DB.prepare('SELECT p.*,u.email,u.display_name FROM dive_center_profiles p JOIN users u ON u.id=p.user_id WHERE p.id=?').bind(id).first())) }
  if (path === '/api/admin/comments' && request.method === 'GET') {
    const collection = await asset(env, 'dive_sites.geojson'), names = new Map(collection.features.map((feature) => [Number(feature.id ?? feature.properties?.fid), feature.properties.site_name])), rows = await env.DB.prepare('SELECT c.id,c.user_id,u.display_name,u.role,c.dive_site_id,c.body,c.created_at,c.updated_at FROM comments c JOIN users u ON u.id=c.user_id ORDER BY c.created_at DESC').all()
    return json(rows.results.map((row) => ({ ...row, dive_site_name: names.get(Number(row.dive_site_id)) || `#${row.dive_site_id}` })))
  }
  if (path === '/api/admin/submissions' && request.method === 'GET') { const rows = await env.DB.prepare(`${SUBMISSION_SELECT} ORDER BY s.created_at DESC`).all(); return json(rows.results) }
  match = path.match(/^\/api\/admin\/submissions\/(\d+)\/(approve|reject|archive)$/)
  if (match && request.method === 'POST') {
    const id = Number(match[1]), action = match[2], input = await readBody(request, ['admin_note']), note = cleanText(input.admin_note, 'admin_note', 0, 1000, true), existing = await submission(env, id)
    fail(action === 'archive' ? existing.status !== 'APPROVED' : existing.status !== 'PENDING', 409, action === 'archive' ? 'Only approved sites can be archived.' : 'Only pending submissions can be reviewed.')
    const status = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'ARCHIVED', timestamp = now(); await env.DB.prepare('UPDATE dive_site_submissions SET status=?,admin_note=?,reviewed_by=?,reviewed_at=?,updated_at=? WHERE id=?').bind(status, note, admin.id, timestamp, timestamp, id).run(); return json(await submission(env, id))
  }
  return null
}

async function route(request, env) {
  const path = new URL(request.url).pathname.replace(/\/$/, '') || '/'
  if (path === '/api/health' && request.method === 'GET') { const db = await env.DB.prepare('SELECT 1 ok').first(); return json({ status: db?.ok === 1 ? 'healthy' : 'degraded', database: 'D1' }) }
  if (path === '/api/dive-sites' && request.method === 'GET') return json(await asset(env, 'dive_sites.geojson'))
  if (path === '/api/dive-centers' && request.method === 'GET') return json(await asset(env, 'dive_centers.geojson'))
  if (path === '/api/departure-points' && request.method === 'GET') return json(await asset(env, 'departure_points.geojson'))
  if (path === '/api/community/dive-sites' && request.method === 'GET') {
    const rows = await env.DB.prepare(`${SUBMISSION_SELECT} WHERE s.status='APPROVED' ORDER BY s.created_at DESC`).all()
    return json({ type: 'FeatureCollection', features: rows.results.map((row) => ({ type: 'Feature', id: `community-${row.id}`, geometry: { type: 'Point', coordinates: [Number(row.longitude), Number(row.latitude)] }, properties: { ...row, data_origin: 'Dive Center Submitted' } })) })
  }
  sameOrigin(request)
  for (const handler of [authRoutes, communityRoutes, centerRoutes, adminRoutes]) { const response = await handler(request, env, path); if (response) return response }
  throw new ApiError(404, 'Not found.')
}

export default {
  async fetch(request, env) {
    try { return new URL(request.url).pathname.startsWith('/api/') ? await route(request, env) : secure(await env.ASSETS.fetch(request)) }
    catch (error) { if (error instanceof ApiError) return json({ detail: error.detail }, error.status); console.error('Worker request failed', error instanceof Error ? error.name : 'UnknownError'); return json({ detail: 'Internal server error.' }, 500) }
  },
}
