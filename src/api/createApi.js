import { createApiClient } from './client.js'
import { createMockFetch } from './mock/createMockFetch.js'

// No endpoints, authorization scheme, or mock resource schemas are guessed here.
export function createApi({ env = {}, handlers = [], getHeaders, fetchImpl = globalThis.fetch } = {}) {
  const mode = env.VITE_API_MODE || 'mock'
  if (mode !== 'mock' && mode !== 'real') throw new Error('VITE_API_MODE must be mock or real')
  if (mode === 'real' && !env.VITE_API_BASE_URL) throw new Error('Set VITE_API_BASE_URL before using the real server')
  return createApiClient({
    baseUrl: mode === 'real' ? env.VITE_API_BASE_URL : '',
    fetchImpl: mode === 'mock' ? createMockFetch({ handlers }) : fetchImpl,
    getHeaders,
  })
}
