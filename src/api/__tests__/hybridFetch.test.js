import test from 'node:test'
import assert from 'node:assert/strict'
import { createHybridFetch, isLiveEndpoint, parseLiveFeatures } from '../hybridFetch.js'

const ok = data => Response.json({ success: true, code: 'TEST_SUCCESS', message: 'ok', data })

test('unknown feature names are ignored and no feature means everything stays Mock', () => {
  assert.deepEqual(parseLiveFeatures('budget, nope ,finance'), ['budget', 'finance'])
  assert.deepEqual(parseLiveFeatures(''), [])
  const mockFetch = async () => ok({ from: 'mock' })
  assert.equal(createHybridFetch({ mockFetch, features: [] }), mockFetch)
})

test('only the enabled feature endpoints go to the live server', () => {
  const budget = ['budget']
  assert.equal(isLiveEndpoint(budget, 'GET', '/api/budgets/2026-11/'), true)
  assert.equal(isLiveEndpoint(budget, 'PUT', '/api/budgets/2026-11/allocation/'), true)
  assert.equal(isLiveEndpoint(budget, 'POST', '/api/income-entries/'), true)
  assert.equal(isLiveEndpoint(budget, 'GET', '/api/budgets/profile/'), false)
  assert.equal(isLiveEndpoint(budget, 'GET', '/api/risks/'), false)
  assert.equal(isLiveEndpoint(['finance'], 'PUT', '/api/budgets/profile/'), true)
  assert.equal(isLiveEndpoint(['loans'], 'POST', '/api/loans/'), true)
  assert.equal(isLiveEndpoint(['loans'], 'DELETE', '/api/loans/12/'), true)
  assert.equal(isLiveEndpoint(['products'], 'GET', '/api/loan-products/options/'), true)
  assert.equal(isLiveEndpoint(['onboarding'], 'POST', '/api/onboarding/complete/'), true)
  assert.equal(isLiveEndpoint(['plans'], 'PUT', '/api/repayment-plans/'), true)
  assert.equal(isLiveEndpoint(['risk'], 'GET', '/api/risks/'), true)
  assert.equal(isLiveEndpoint(['report'], 'GET', '/api/reports/latest/'), true)
  assert.equal(isLiveEndpoint(['report'], 'GET', '/api/reports/42/'), true)
  assert.equal(isLiveEndpoint(['report'], 'PATCH', '/api/reports/comparison-settings/'), true)
  assert.equal(isLiveEndpoint(['risk'], 'POST', '/api/reports/'), false)
})

test('live calls share one session bootstrap, use cookies and never fall back to Mock on failure', async () => {
  const calls = []
  const mockFetch = async () => ok({ from: 'mock' })
  const liveFetch = async (url, init) => { calls.push({ url, init }); return url.includes('income-entries') ? new Response('x', { status: 503 }) : ok({ from: 'live' }) }
  const fetch = createHybridFetch({ mockFetch, liveFetch, features: ['budget'], baseUrl: 'https://dev-api.example/' })
  const [a, b] = await Promise.all([fetch('https://dev-api.example/api/budgets/2026-11/', {}), fetch('https://dev-api.example/api/loans/', {})])
  assert.equal((await a.json()).data.from, 'live')
  assert.equal((await b.json()).data.from, 'live')
  assert.equal(calls[0].url, 'https://dev-api.example/api/users/me/')
  assert.equal(calls.length, 3)
  for (const { init } of calls) assert.equal(init.credentials, 'include')
  const mocked = await fetch('https://dev-api.example/api/risks/', {})
  assert.equal((await mocked.json()).data.from, 'mock')
  assert.equal(calls.length, 3)
  const failed = await fetch('https://dev-api.example/api/income-entries/', { method: 'POST' })
  assert.equal(failed.status, 503)
})
