import { ApiError } from './ApiError.js'

export function createApiClient({ baseUrl = '', fetchImpl = globalThis.fetch, getHeaders = () => ({}), credentials = 'same-origin' } = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('An HTTP transport is required')
  async function request(path, { method = 'GET', query, body, headers, signal, responseType = 'json' } = {}) {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) throw new TypeError('API paths must be relative to the configured server')
    const params = new URLSearchParams()
    for (const [key,value] of Object.entries(query || {})) if(value != null) for(const item of Array.isArray(value)?value:[value]) params.append(key,String(item))
    const url = baseUrl.replace(/\/$/,'') + path + (params.size ? (path.includes('?')?'&':'?')+params : '')
    const requestHeaders = new Headers(await getHeaders())
    new Headers(headers).forEach((value,key)=>requestHeaders.set(key,value))
    requestHeaders.set('Accept', responseType === 'blob' ? 'text/csv, application/json' : 'application/json')
    if(body !== undefined)requestHeaders.set('Content-Type','application/json')
    let response
    try { response = await fetchImpl(url,{method,headers:requestHeaders,credentials,...(body!==undefined?{body:JSON.stringify(body)}:{}),signal}) }
    catch(cause) { if(signal?.aborted || cause?.name==='AbortError'||cause instanceof ApiError)throw cause;throw new ApiError('서버에 연결할 수 없습니다.',{kind:'network',cause}) }
    if(responseType==='blob' && response.ok && response.headers.get('Content-Type')?.includes('text/csv')) {
      const disposition=response.headers.get('Content-Disposition') || ''
      const filename=disposition.match(/filename="([^"]+)"/)?.[1] || 'ronrun-export.csv'
      return {blob:await response.blob(),filename}
    }
    let envelope
    try { envelope=await response.json() }
    catch(cause) { if(signal?.aborted || cause?.name==='AbortError')throw cause;throw new ApiError('서버 응답을 읽을 수 없습니다.',{kind:'invalid-response',status:response.status,cause}) }
    if(!envelope || typeof envelope.success!=='boolean' || typeof envelope.code!=='string' || typeof envelope.message!=='string')throw new ApiError('API 응답 형식이 명세와 다릅니다.',{kind:'invalid-response',status:response.status})
    if(!response.ok || !envelope.success)throw new ApiError(envelope.message,{kind:'server',status:response.status,code:envelope.code,data:envelope.data??null,errors:envelope.errors??{}})
    if(!Object.hasOwn(envelope,'data'))throw new ApiError('API 응답에 data가 없습니다.',{kind:'invalid-response',status:response.status})
    return envelope.data
  }
  return {request}
}

