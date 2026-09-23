const GEOSERVER_ORIGIN = 'https://diveplanner-geoserver.onrender.com'

function configurationError(message) {
  return new Response(JSON.stringify({ detail: message }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

function parseHttpsOrigin(value, variableName) {
  if (!value) {
    throw new Error(`${variableName} is not configured`)
  }

  const origin = new URL(value)
  if (
    origin.protocol !== 'https:' ||
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash
  ) {
    throw new Error(`${variableName} must be an HTTPS origin without a path`)
  }
  return origin
}

async function proxyToOrigin(request, originValue, variableName) {
  let origin
  try {
    origin = parseHttpsOrigin(originValue, variableName)
  } catch (error) {
    return configurationError(
      error instanceof Error ? error.message : `${variableName} is invalid`,
    )
  }

  const incomingUrl = new URL(request.url)
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, origin)
  const upstreamRequest = new Request(upstreamUrl, request)
  upstreamRequest.headers.set('X-Forwarded-Host', incomingUrl.host)
  upstreamRequest.headers.set('X-Forwarded-Proto', incomingUrl.protocol.slice(0, -1))
  return fetch(upstreamRequest)
}

export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname

    if (pathname.startsWith('/api/')) {
      return proxyToOrigin(request, env.FASTAPI_ORIGIN, 'FASTAPI_ORIGIN')
    }

    if (pathname.startsWith('/geoserver/')) {
      return proxyToOrigin(request, GEOSERVER_ORIGIN, 'GEOSERVER_ORIGIN')
    }

    return env.ASSETS.fetch(request)
  },
}
