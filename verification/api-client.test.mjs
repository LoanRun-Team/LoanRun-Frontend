import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient } from '../src/api/client.js'
import { createMockFetch } from '../src/api/mock/createMockFetch.js'
import { createApi } from '../src/api/createApi.js'

const example = {
  success: true,
  code: 'LOAN_DETAIL_SUCCESS',
  message: 'Loan detail retrieved',
  data: { loan_id: 1, original_principal: 10000000, remaining_principal: 7000000 },
}
// /contract-example exists only in this test. It is not an assumed product endpoint.
const makeClient = (body = example, status = 200) => createApiClient({
  fetchImpl: createMockFetch({ delayMs: 0, handlers: [{
    method: 'GET', path: '/contract-example', respond: () => ({ status, body }),
  }] }),
})
test('mock calls unwrap the backend envelope without changing snake_case fields', async () => {
  assert.deepEqual(await makeClient().request('/contract-example'), example.data)
})
test('query parameters, JSON bodies and supplied authentication reach the transport', async () => {
  let actual
  const client = createApiClient({ baseUrl: 'https://example.invalid/api/', getHeaders: () => ({ 'X-Test': 'test' }),
    fetchImpl: async (url, options) => {
      actual = { url, options }
      return new Response(JSON.stringify(example))
    },
  })
  await client.request('/contract-example', { method:'POST', query:{ active:true, page:0, empty:null, ids:[1,2] }, body:{ amount:123000 } })
  assert.equal(actual.url,'https://example.invalid/api/contract-example?active=true&page=0&ids=1&ids=2')
  assert.equal(actual.options.headers.get('X-Test'),'test')
  assert.equal(actual.options.body,'{"amount":123000}')
})
test('HTTP failures and success=false retain backend error messages and codes', async () => {
  for(const status of [200,400]) {
    const error = { success:false, code:'EXAMPLE_FAILURE', message:'Validation failed', data:{ field:'amount' } }
    await assert.rejects(makeClient(error,status).request('/contract-example'), e =>
      e.kind==='server' && e.code==='EXAMPLE_FAILURE' && e.message==='Validation failed' && e.data.field==='amount')
  }
})
test('malformed responses are not silently replaced by dummy values', async () => {
  await assert.rejects(makeClient({ arbitrary:true }).request('/contract-example'),e=>e.kind==='invalid-response')
  const client=createApiClient({fetchImpl:async()=>new Response('<html>error</html>')})
  await assert.rejects(client.request('/contract-example'),e=>e.kind==='invalid-response')
})
test('cancelled mock requests never invoke the response handler', async () => {
  let invoked=false
  const signalController=new AbortController()
  const client=createApiClient({ fetchImpl:createMockFetch({delayMs:100,handlers:[{method:'GET',path:'/contract-example',respond:()=>{invoked=true;return {body:example}}}]}) })
  const promise=client.request('/contract-example',{signal:signalController.signal})
  signalController.abort()
  await assert.rejects(promise,e=>e.name==='AbortError')
  assert.equal(invoked,false)
})
test('real mode requires an explicit server and does not use mock handlers', async () => {
  assert.throws(()=>createApi({env:{VITE_API_MODE:'real'}}),/VITE_API_BASE_URL/)
  let url
  const api=createApi({env:{VITE_API_MODE:'real',VITE_API_BASE_URL:'https://example.invalid'},fetchImpl:async input=>{url=input;return new Response(JSON.stringify(example))}})
  await api.request('/contract-example')
  assert.equal(url,'https://example.invalid/contract-example')
})
