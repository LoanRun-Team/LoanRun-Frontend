import {test} from 'node:test'
import assert from 'node:assert/strict'
import {loadHomeReport} from '../homeReportView.js'
import {createRuntime} from '../createRuntime.js'

test('Free report entry never requests Pro data',async()=>{
  const result=await loadHomeReport({latestReport:()=>{throw Error('unexpected request')}},'Free')
  assert.equal(result.locked,true);assert.equal(result.updated_at,null);assert.equal(result.is_new,false)
})
test('completed fresh report uses server generation date, while stale and pending results never receive a new badge',async()=>{
  const signal=new AbortController().signal
  for(const [status,stale,isNew] of [['COMPLETED',false,true],['COMPLETED',true,false],['PENDING',false,false],['FAILED',false,false],['NOT_GENERATED',false,false]]){
    const row=await loadHomeReport({latestReport:async s=>{assert.equal(s,signal);return {status,stale,generated_at:'2026-11-20T10:00:00+09:00'}}},'Pro',signal)
    assert.equal(row.is_new,isNew);assert.equal(row.status,status);assert.equal(row.updated_at,'2026-11-20T10:00:00+09:00')
  }
})
test('hybrid latest report uses cookie transport and never substitutes mock data on server failure',async()=>{
  const calls=[]
  const {services}=createRuntime({env:{VITE_API_MODE:'hybrid'},fetchImpl:async(url,init)=>{
    calls.push([url,init]);return new Response(JSON.stringify(url==='/api/users/me/'?{success:true,code:'PROFILE_SUCCESS',message:'ok',data:{plan_type:'PRO'}}:{success:false,code:'SERVICE_UNAVAILABLE',message:'unavailable'}),{status:url==='/api/users/me/'?200:503})
  }})
  await assert.rejects(loadHomeReport(services,'Pro'),e=>e.status===503)
  assert.equal(calls[1][0],'/api/reports/latest/');assert.equal(calls[1][1].credentials,'include');assert.equal(calls[1][1].headers.Authorization,undefined)
})
