import { createApiClient } from './client.js'
import { createMockFetch } from './mock/createMockFetch.js'
import { createMockServer } from './mock/server.js'
import { createHybridFetch, parseLiveFeatures } from './hybridFetch.js'

export function createApi({ env = {}, handlers = [], getHeaders, fetchImpl = globalThis.fetch } = {}) {
  const mode = env.VITE_API_MODE || 'mock'
  if (!['mock','hybrid','real'].includes(mode)) throw new Error('VITE_API_MODE must be mock, hybrid or real')
  if (mode === 'real' && !env.VITE_API_BASE_URL) throw new Error('Set VITE_API_BASE_URL before using the real server')
  const mockFetch = handlers.length ? createMockFetch({ handlers }) : createMockServer().fetch
  // hybrid 에서는 VITE_LIVE_FEATURES 에 적은 영역만 실서버로 보내고 나머지는 Mock 이다.
  const features = mode === 'hybrid' ? parseLiveFeatures(env.VITE_LIVE_FEATURES) : []
  const live = features.length > 0
  return createApiClient({
    baseUrl: mode === 'real' || live ? (env.VITE_API_BASE_URL || '') : '',
    // hybrid 에서 온보딩·예산·위험·리포트는 VITE_LIVE_FEATURES 로 켜지 않으면 Mock 이다.
    fetchImpl: mode === 'real' ? fetchImpl : createHybridFetch({ mockFetch, liveFetch: fetchImpl, features, baseUrl: env.VITE_API_BASE_URL || '' }),
    credentials: mode === 'real' || live ? 'include' : 'same-origin',
    getHeaders,
  })
}
