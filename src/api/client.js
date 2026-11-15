import { ApiError } from './ApiError.js'

// The envelope is confirmed by the backend's example.
// Endpoint paths and resource fields must be supplied from the actual specification.
export function createApiClient({ baseUrl = '', fetchImpl = globalThis.fetch, getHeaders = () => ({}) } = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('An HTTP transport is required')

  async function request(path, { method = 'GET', query, body, headers, signal } = {}) {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
      throw new TypeError('API paths must be relative to the configured server')
    }
    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query || {})) {
      if (value == null) continue
      for (const item of Array.isArray(value) ? value : [value]) queryParams.append(key, String(item))
    }
    const suffix = queryParams.toString()
    const url = baseUrl.replace(/\/$/, '') + path + (suffix ? (path.includes('?') ? '&' : '?') + suffix : '')
    const requestHeaders = new Headers(await getHeaders())
    new Headers(headers).forEach((value, key) => requestHeaders.set(key, value))
    requestHeaders.set('Accept', 'application/json')
    const hasBody = body !== undefined
    if (hasBody) requestHeaders.set('Content-Type', 'application/json')

    let response
    try {
      response = await fetchImpl(url, {
        method,
        headers: requestHeaders,
        ...(hasBody ? { body: JSON.stringify(body) } : {}),
        signal,
      })
    } catch (cause) {
      if (signal?.aborted || cause?.name === 'AbortError') throw cause
      throw new ApiError('API request could not reach the server', { kind: 'network', cause })
    }
    let envelope
    try {
      envelope = await response.json()
    } catch (cause) {
      throw new ApiError('API response is not valid JSON', { kind: 'invalid-response', status: response.status, cause })
    }
    if (!envelope || typeof envelope !== 'object' || typeof envelope.success !== 'boolean' ||
        typeof envelope.code !== 'string' || typeof envelope.message !== 'string') {
      throw new ApiError('API response does not match the agreed envelope', { kind: 'invalid-response', status: response.status })
    }
    if (!response.ok || !envelope.success) {
      throw new ApiError(envelope.message, {
        kind: 'server', status: response.status, code: envelope.code, data: envelope.data ?? null,
      })
    }
    if (!Object.hasOwn(envelope, 'data')) {
      throw new ApiError('Successful API response is missing data', { kind: 'invalid-response', status: response.status })
    }
    return envelope.data
  }

  return { request }
}
