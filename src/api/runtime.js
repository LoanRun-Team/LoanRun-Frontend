import { createApiClient } from './client.js'
import { createServices } from './services.js'
import { createMockServer } from './mock/server.js'

const env = import.meta.env || {}
export const isMock = env.VITE_API_MODE !== 'real'
if(!isMock&&!env.VITE_API_BASE_URL)throw new Error('VITE_API_BASE_URL is required in real mode')
const mock = isMock ? createMockServer({ storage: globalThis.localStorage }) : null
export const services = createServices(createApiClient({
  baseUrl: isMock ? '' : (env.VITE_API_BASE_URL || ''),
  fetchImpl: mock ? mock.fetch : (...args) => globalThis.fetch(...args),
  getHeaders: () => {
    const token = isMock ? 'mock-access-token' : globalThis.sessionStorage?.getItem('loanrun.access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
}))
