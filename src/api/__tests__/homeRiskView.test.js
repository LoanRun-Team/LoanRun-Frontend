import test from 'node:test'
import assert from 'node:assert/strict'
import { homeRiskView,loadHomeRisk } from '../homeRiskView.js'
import { createRuntime } from '../createRuntime.js'

test('home thresholds show basic repayment before extra repayment in the correct units',()=>{
  const view=homeRiskView({level:'CAUTION',rate_thresholds:{basic_at_risk_from:2.25,reduce_extra_from:0.5},income_thresholds:{basic_at_risk_from:30,reduce_extra_from:12.5},expense_thresholds:{basic_at_risk_from:500000,reduce_extra_from:100000}})
  assert.equal(view.label,'주의');assert.equal(view.markerPercent,50)
  assert.deepEqual(view.rows.map(r=>r.value),['+2.25%p / +0.5%p','−30% / −12.5%','+500,000원 / +100,000원'])
})

test('zero thresholds remain zero and unknown thresholds remain unknown independently',()=>{
  const view=homeRiskView({level:null,rate_thresholds:{basic_at_risk_from:0,reduce_extra_from:null},income_thresholds:{basic_at_risk_from:null,reduce_extra_from:0},expense_thresholds:{basic_at_risk_from:0,reduce_extra_from:0}})
  assert.deepEqual(view.rows.map(r=>r.value),['0%p / —','— / 0%','0원 / 0원'])
  assert.equal(view.label,'자료 부족');assert.equal(view.markerPercent,null)
  assert.deepEqual(homeRiskView(null).rows.map(r=>r.value),['— / —','— / —','— / —'])
})

test('the backend level is authoritative even when score and thresholds do not determine it',()=>{
  const view=homeRiskView({level:'DANGER',score:0})
  assert.equal(view.label,'위험');assert.equal(view.markerPercent,84)
})

test('Free plan never requests the Pro risk API and Pro passes the abort signal',async()=>{
  const calls=[],controller=new AbortController(),data={level:'STABLE'}
  const api={risks:signal=>{calls.push(signal);return Promise.resolve(data)}}
  assert.equal(await loadHomeRisk(api,'Free',controller.signal),null)
  assert.equal(calls.length,0)
  assert.equal(await loadHomeRisk(api,'Pro',controller.signal),data)
  assert.equal(calls[0],controller.signal)
})

test('hybrid risk uses the live cookie transport and preserves server failures without Mock fallback',async()=>{
  const calls=[]
  const {services}=createRuntime({env:{VITE_API_MODE:'hybrid'},fetchImpl:async(url,init)=>{
    calls.push({url,init})
    if(url==='/api/users/me/')return Response.json({success:true,code:'USER_DETAIL_SUCCESS',message:'ok',data:{plan_type:'PRO'}})
    return Response.json({success:false,code:'SERVICE_UNAVAILABLE',message:'risk unavailable',data:null},{status:503})
  }})
  await assert.rejects(()=>loadHomeRisk(services,'Pro'),{status:503,code:'SERVICE_UNAVAILABLE'})
  assert.deepEqual(calls.map(c=>c.url),['/api/users/me/','/api/risks/'])
  assert.equal(calls[1].init.credentials,'include');assert.equal(calls[1].init.headers.has('Authorization'),false)
})
