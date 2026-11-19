import test from 'node:test'
import assert from 'node:assert/strict'
import { createRuntime } from '../createRuntime.js'
import { createServices } from '../services.js'
import { loanFormInput } from '../loanRequest.js'
import { loanView } from '../loanView.js'

const ok=data=>Response.json({success:true,code:'TEST_SUCCESS',message:'ok',data})
const env={VITE_API_MODE:'hybrid'}

test('parallel reads share one completed session bootstrap and use cookies without bearer tokens',async()=>{
  const calls=[];let release
  const ready=new Promise(resolve=>{release=resolve})
  const runtime=createRuntime({env,fetchImpl:async(url,init)=>{calls.push({url,init});if(calls.length===1)await ready;return ok({})}})
  const results=Promise.all([runtime.services.loans(),runtime.services.notifications()])
  await new Promise(resolve=>setTimeout(resolve,0))
  assert.equal(calls.length,1)
  assert.equal(calls[0].url,'/api/users/me/')
  release();await results
  assert.equal(calls.length,3)
  for(const {init} of calls){assert.equal(init.credentials,'include');assert.equal(init.headers.has('Authorization'),false)}
})

test('unavailable writes and financial forecasts are blocked before sending any request',async()=>{
  let calls=0
  const {services}=createRuntime({env,fetchImpl:async()=>{calls++;return ok({})}})
  for(const action of [()=>services.dashboard(),()=>services.loan(9041),()=>services.createLoan({}),()=>services.createPayment({}),()=>services.savePlan({}),()=>services.deleteAccount()])await assert.rejects(action,{code:'API_NOT_READY'})
  assert.equal(calls,0)
})

test('server failure stays a failure, bootstrap retries, and does not return sample data',async()=>{
  let calls=0
  const {services}=createRuntime({env,fetchImpl:async()=>{calls++;return Response.json({success:false,code:'DEPENDENCY_UNAVAILABLE',message:'not ready',data:null},{status:503})}})
  await assert.rejects(()=>services.loans(),{status:503,code:'DEPENDENCY_UNAVAILABLE'})
  await assert.rejects(()=>services.loans(),{status:503})
  assert.equal(calls,2)
})

test('aborting a component does not abort session bootstrap used by another component',async()=>{
  let release;const ready=new Promise(resolve=>{release=resolve}),calls=[]
  const {services}=createRuntime({env,fetchImpl:async(url,init)=>{calls.push({url,init});if(calls.length===1)await ready;return ok({})}})
  const controller=new AbortController()
  const first=services.loans(controller.signal),rejection=assert.rejects(first,{name:'AbortError'})
  const second=services.notifications()
  await new Promise(resolve=>setTimeout(resolve,0));controller.abort();release()
  await Promise.all([rejection,second])
  assert.equal(calls.length,2)
  assert.equal(calls[0].init.signal,undefined)
  assert.equal(calls[1].url,'/api/settings/notifications/')
})

test('ready resource reads retain real record ids and configured deployment URL',async()=>{
  const calls=[]
  const {services}=createRuntime({env:{...env,VITE_API_BASE_URL:'https://backend.example/'},fetchImpl:async(url)=>{calls.push(url);return ok({})}})
  await services.rates(9041);await services.savings(9041);await services.payment(8402)
  assert.deepEqual(calls,['https://backend.example/api/users/me/','https://backend.example/api/loans/9041/rate-history/','https://backend.example/api/repayment-savings/?loan_id=9041','https://backend.example/api/payments/8402/'])
})

test('payment filters use the backend from/to/type names and retain pagination',async()=>{
  let request
  const services=createServices({request:(path,options)=>{request={path,...options}}})
  services.payments({loan_id:9041,start_date:'2026-11-01',end_date:'2026-11-19',payment_type:'EXTRA',page:2,page_size:20})
  assert.deepEqual(request.query,{loan_id:9041,from:'2026-11-01',to:'2026-11-19',type:'EXTRA',page:2,page_size:20})
})

test('preview requests strip response-only fields without changing monetary values',()=>{
  let request
  const services=createServices({request:(path,options)=>{request={path,...options}}})
  services.previewLoan({loan_id:9041,remaining_principal:7000000,annual_rate:4.2,plan:{},status:'ACTIVE',estimated_monthly_payment:123,initial_savings_balance:0})
  assert.deepEqual(request.body,{remaining_principal:7000000,annual_rate:4.2,initial_savings_balance:0})
  const form=loanFormInput({loan_type:'CREDIT',product_id:null,bank:'Bank',product:'Loan',method:'BULLET',original:'10000000',balance:'7000000',rate:'0',variable:false,start:'2026-01-01',maturity:'2027-01-01',day:'25',payment:'',feeStatus:'unknown'})
  assert.equal(form.product_id,null);assert.equal(form.annual_rate,0);assert.equal(form.payment_day,25);assert.equal(form.prepayment_policy,null)
})

test('loan list values render without inventing missing repayment plans or forecasts',()=>{
  const loan=loanView({loan_id:9041,product_name:'Loan',institution_name:'Bank',remaining_principal:7000000,original_principal:10000000,progress_percent:30,annual_rate:4.2,rate_type:'FIXED',loan_type:'CREDIT',estimated_monthly_payment:120000})
  assert.equal(loan.id,'9041');assert.equal(loan.payment,120000)
  assert.equal(loan.finish,'—');assert.equal(loan.interest,'—');assert.equal(loan.principalPayment,null)
})

test('mock mode never contacts the server',async()=>{
  const {services}=createRuntime({env:{VITE_API_MODE:'mock'},fetchImpl:()=>{throw new Error('unexpected network')}})
  const profile=await services.profile()
  assert.equal(typeof profile.name,'string')
})

test('subscription updates send only plan_type with cookies and preserve demo-mode denial',async()=>{
  const calls=[]
  const {services}=createRuntime({env,fetchImpl:async(url,init)=>{
    calls.push({url,init})
    if(init.method==='PATCH')return Response.json({success:false,code:'DEMO_MODE_REQUIRED',message:'시연 모드에서만 변경할 수 있습니다.',data:null},{status:403})
    return ok({plan_type:'FREE'})
  }})
  await assert.rejects(()=>services.updateSubscription('PRO'),{status:403,code:'DEMO_MODE_REQUIRED'})
  const request=calls.find(row=>row.init.method==='PATCH')
  assert.equal(request.url,'/api/settings/subscription/')
  assert.deepEqual(JSON.parse(request.init.body),{plan_type:'PRO'})
  assert.equal(request.init.credentials,'include')
  assert.equal(request.init.headers.has('Authorization'),false)
})

test('Mock subscription changes persist and remain consistent with profile and dashboard',async()=>{
  const saved=new Map(),storage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)}
  const runtime=()=>createRuntime({env:{VITE_API_MODE:'mock'},storage}).services
  const services=runtime()
  await services.updateSubscription('FREE')
  assert.equal((await services.subscription()).plan_type,'FREE')
  await services.updateSubscription('PRO')
  const reloaded=runtime()
  assert.equal((await reloaded.subscription()).plan_type,'PRO')
  assert.equal((await reloaded.profile()).plan_type,'PRO')
  assert.equal((await reloaded.dashboard()).plan_type,'PRO')
  await assert.rejects(()=>services.updateSubscription('INVALID'),{status:400})
})
