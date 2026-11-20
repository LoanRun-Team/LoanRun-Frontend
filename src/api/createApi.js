import { createApiClient } from './client.js'
import { createMockFetch } from './mock/createMockFetch.js'
import { createMockServer } from './mock/server.js'

export function createApi({ env = {}, handlers = [], getHeaders, fetchImpl = globalThis.fetch } = {}) {
  const mode = env.VITE_API_MODE || 'mock'
  if (!['mock','hybrid','real'].includes(mode)) throw new Error('VITE_API_MODE must be mock, hybrid or real')
  if (mode === 'real' && !env.VITE_API_BASE_URL) throw new Error('Set VITE_API_BASE_URL before using the real server')
  return createApiClient({
    baseUrl: mode === 'real' ? env.VITE_API_BASE_URL : '',
    // Team-owned onboarding/budget/risk/report handlers remain Mock in hybrid mode.
    fetchImpl: mode !== 'real' ? (handlers.length ? createMockFetch({ handlers }) : createMockServer().fetch) : fetchImpl,
    credentials: mode==='real'?'include':'same-origin',
    getHeaders,
  })
}
