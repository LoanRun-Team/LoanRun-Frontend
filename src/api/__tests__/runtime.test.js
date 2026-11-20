import test from 'node:test'
import assert from 'node:assert/strict'
import { createRuntime } from '../createRuntime.js'
import { createServices } from '../services.js'
import { loanFormInput } from '../loanRequest.js'
import { loanView } from '../loanView.js'
import { monthlyRecords,monthlyPayments,homeLoanSummary } from '../connectedViews.js'
import { loadLoanWorkspace,paymentInput,regularPaymentDue } from '../loanWorkspace.js'

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

test('unimplemented dashboard and authentication APIs remain blocked before any request',async()=>{
  let calls=0
  const {services}=createRuntime({env,fetchImpl:async()=>{calls++;return ok({})}})
  for(const action of [()=>services.dashboard(),()=>services.risks(),()=>services.logout(),()=>services.deleteAccount()])await assert.rejects(action,{code:'API_NOT_READY'})
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

test('hybrid reads schedule and monthly summaries while authentication remains unavailable',async()=>{
  const calls=[]
  const {services}=createRuntime({env,fetchImpl:async url=>{calls.push(url);return ok({months:[],due_items:[]})}})
  await services.schedule({month:'2026-11',loan_id:9041})
  await services.monthly({from_month:'2026-06',to_month:'2026-11',loan_id:9041})
  assert.equal(calls[1],'/api/payments/schedule/?month=2026-11&loan_id=9041')
  assert.equal(calls[2],'/api/payments/monthly-summary/?from_month=2026-06&to_month=2026-11&loan_id=9041')
  await assert.rejects(()=>services.deleteAccount(),{code:'API_NOT_READY'})
})

test('monthly records retain unobserved months, unknown targets and confirmed zero separately',()=>{
  const {rows}=monthlyRecords({months:[
    {year_month:'2026-10',observed:false,payment_count:2,actual_amount:null,principal_amount:null,interest_amount:null,extra_amount:null,target_amount:null},
    {year_month:'2026-11',observed:true,payment_count:0,actual_amount:0,principal_amount:0,interest_amount:0,extra_amount:0,target_amount:100000}]})
  assert.equal(rows.length,2)
  assert.equal(rows[0].actual,null);assert.equal(rows[0].target,null);assert.equal(rows[0].paymentCount,2)
  assert.equal(rows[1].actual,0);assert.equal(rows[1].target,100000)
})

test('calendar payment reads include every filtered page and correct leap-year month boundary',async()=>{
  const calls=[],controller=new AbortController()
  const rows=await monthlyPayments({payments:async(query,signal)=>{
    calls.push({query,signal});return {results:[{payment_id:query.page}],next_page:query.page===1?2:null}
  }},'2028-02',9041,controller.signal)
  assert.deepEqual(rows,[{payment_id:1},{payment_id:2}])
  assert.equal(calls[0].query.from,'2028-02-01');assert.equal(calls[0].query.to,'2028-02-29')
  assert.equal(calls[1].query.loan_id,9041);assert.equal(calls[1].signal,controller.signal)
})

test('home loan summary uses real list balances and never fabricates payoff or due dates',()=>{
  const summary=homeLoanSummary({total_remaining_principal:700,loans:[{loan_id:9041,original_principal:1000,paid_principal:300}]})
  assert.equal(summary.total_remaining_principal,700);assert.equal(summary.overall_progress_percent,30)
  assert.equal(summary.next_payment,null)
  assert.equal(homeLoanSummary({total_remaining_principal:0,loans:[]}).overall_progress_percent,null)
})

test('connected writes preserve methods, JSON numbers and caller-provided idempotency keys',async()=>{
  const calls=[]
  const {services}=createRuntime({env,fetchImpl:async(url,init)=>{calls.push({url,init});return ok({})}})
  await services.saveFinance({monthly_income:3000000,income_type:'REGULAR',payday:25,fixed_essential_expenses:1000000,variable_essential_expenses:0,discretionary_expenses:0,savings:0,emergency_fund:null,user_id:99})
  await services.createLoan({remaining_principal:1000000},'loan-key')
  await services.updateLoan(9041,{remaining_principal:900000})
  await services.saveRate(9041,{effective_date:'2026-11-20',annual_rate:4.2})
  await services.createPayment({loan_id:9041,amount:10000},'create-key')
  await services.updatePayment(8402,{amount:15000},'update-key')
  await services.deletePayment(8402,'delete-key')
  await services.createSaving({loan_id:9041,amount:50000,saved_at:'2026-11-20'},'saving-key')
  await services.updateSaving(700,{amount:60000},'saving-update-key')
  await services.deleteSaving(700,'saving-delete-key')
  await services.savePlan({plans:[{loan_id:9041,mode:'EXTRA_AMOUNT',extra_monthly_payment:10000}],preview_version:'server-token'},'plan-key')
  const finance=calls.find(c=>c.url==='/api/budgets/profile/')
  assert.equal(finance.init.method,'PUT');assert.equal(JSON.parse(finance.init.body).monthly_income,3000000)
  assert.equal(Object.hasOwn(JSON.parse(finance.init.body),'user_id'),false)
  for(const [path,key] of [['/api/loans/','loan-key'],['/api/payments/','create-key'],['/api/repayment-plans/','plan-key']])assert.equal(calls.find(c=>c.url===path).init.headers.get('Idempotency-Key'),key)
  const patch=calls.find(c=>c.url==='/api/payments/8402/'&&c.init.method==='PATCH')
  assert.equal(patch.init.headers.get('Idempotency-Key'),'update-key')
  const removal=calls.find(c=>c.url==='/api/payments/8402/'&&c.init.method==='DELETE')
  assert.equal(removal.init.headers.get('Idempotency-Key'),'delete-key');assert.equal(removal.init.body,undefined)
  for(const {init} of calls){assert.equal(init.credentials,'include');assert.equal(init.headers.has('Authorization'),false)}
})

test('loan overview stays available without detail, catalog or calendar requests',async()=>{
  const api=createRuntime({env:{VITE_API_MODE:'mock'}}).services
  api.loan=api.options=api.products=api.schedule=()=>{throw new Error('unexpected unrelated request')}
  const data=await loadLoanWorkspace(api,{page:'overview',month:'2026-11'},new AbortController().signal)
  assert.ok(data.loans.length)
  assert.equal(data.loans[0].id,String(data.list.loans[0].loan_id))
  assert.equal(data.schedule,null)
  assert.equal(data.options.institutions.length,0)
})

test('monthly payments do not depend on failing loan detail requests',async()=>{
  const api=createRuntime({env:{VITE_API_MODE:'mock'}}).services
  api.loan=()=>{throw new Error('detail unavailable')}
  const data=await loadLoanWorkspace(api,{page:'monthly',month:'2026-11'},new AbortController().signal)
  assert.ok(data.loans.length)
  assert.ok(Array.isArray(data.schedule.due_items))
})

test('a required plan detail error is surfaced rather than replaced with list or Mock data',async()=>{
  const api=createRuntime({env:{VITE_API_MODE:'mock'}}).services
  const error=Object.assign(new Error('Service unavailable'),{status:503,code:'SERVICE_UNAVAILABLE'})
  api.loan=()=>Promise.reject(error)
  await assert.rejects(()=>loadLoanWorkspace(api,{page:'plan',month:'2026-11'},new AbortController().signal),{status:503,code:'SERVICE_UNAVAILABLE'})
})

test('payment input separates create-only loan id from editable fields and automatic breakdown',()=>{
  const body=paymentInput({loanId:'9041',date:'2026-11-20',amount:10000,type:'extra',usedSavings:2000},undefined)
  assert.deepEqual(body,{paid_at:'2026-11-20',amount:10000,payment_type:'EXTRA',due_item_id:null,savings_used_amount:2000})
  assert.equal(Object.hasOwn(body,'loan_id'),false)
  assert.equal(Object.hasOwn(body,'fee_amount'),false)
  const manual=paymentInput({date:'2026-11-20',amount:10000,type:'regular',breakdown:{principal:7000,extra:0,interest:2000,fee:1000}},402)
  assert.equal(manual.due_item_id,402)
  assert.equal(manual.principal_amount+manual.extra_amount+manual.interest_amount+manual.fee_amount,10000)
})

test('regular payment uses the oldest unpaid due returned by the backend, regardless of payment month',async()=>{
  const calls=[]
  const api={loan:async id=>{calls.push(id);return {next_payment:{due_item_id:301,due_date:'2026-10-25',outstanding_amount:10000}}}}
  assert.equal(await regularPaymentDue(api,'9041'),301)
  assert.deepEqual(calls,[9041])
  await assert.rejects(()=>regularPaymentDue({loan:async()=>({next_payment:null})},9041),/정기 회차/)
  await assert.rejects(()=>regularPaymentDue({loan:async()=>{throw Object.assign(new Error('unavailable'),{status:503})}},9041),{status:503})
})
