import { createApiClient } from './client.js'
import { createServices } from './services.js'
import { createMockServer } from './mock/server.js'
import { ApiError } from './ApiError.js'

// Audited against LoanRun-Backend develop befc6c7 (2026-11-19).
// No failure-based fallback: a live error must never become sample financial data.
export function isConnectedEndpoint(method,path) {
  if(path==='/api/users/me/')return ['GET','PATCH'].includes(method)
  if(['/api/settings/subscription/','/api/settings/notifications/'].includes(path))return ['GET','PATCH'].includes(method)
  if(path==='/api/loans/preview/')return method==='POST'
  if(method!=='GET')return false
  return ['/api/loans/','/api/payments/','/api/repayment-savings/','/api/settings/export/'].includes(path)
    ||/^\/api\/payments\/\d+\/$/.test(path)
    ||/^\/api\/loans\/\d+\/rate-history\/$/.test(path)
}

export function createRuntime({env={},fetchImpl=(...args)=>globalThis.fetch(...args),storage}={}) {
  const mode=env.VITE_API_MODE||'mock'
  if(!['mock','hybrid','real'].includes(mode))throw new Error('VITE_API_MODE must be mock, hybrid or real')
  const baseUrl=env.VITE_API_BASE_URL||''
  const mockClient=createApiClient({fetchImpl:createMockServer({storage}).fetch,getHeaders:()=>({Authorization:'Bearer mock-access-token'})})
  const sessionClient=createApiClient({baseUrl,fetchImpl,credentials:'include'})
  let sessionReady
  // Parallel first requests must share one anonymous session cookie. Do not tie
  // bootstrap to a component's signal (React StrictMode can abort that component).
  function ensureSession(){
    if(!sessionReady)sessionReady=sessionClient.request('/api/users/me/').catch(error=>{sessionReady=undefined;throw error})
    return sessionReady
  }
  const liveClient=createApiClient({baseUrl,credentials:'include',fetchImpl:async(url,init)=>{
    if(init.signal?.aborted)throw new DOMException('Aborted','AbortError')
    await ensureSession()
    if(init.signal?.aborted)throw new DOMException('Aborted','AbortError')
    return fetchImpl(url,init)
  }})
  const partialClient={request(path,options={}){
    if(!isConnectedEndpoint(options.method||'GET',path))return Promise.reject(new ApiError('아직 서버에 연결되지 않은 기능이에요.',{kind:'unavailable',code:'API_NOT_READY'}))
    return liveClient.request(path,options)
  }}
  return {mode,services:createServices(mode==='mock'?mockClient:mode==='real'?liveClient:partialClient),mockServices:createServices(mockClient),liveServices:createServices(liveClient),ensureSession}
}
