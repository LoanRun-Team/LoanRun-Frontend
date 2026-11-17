import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createMockServer } from '../src/api/mock/server.js'
import { createApiClient } from '../src/api/client.js'
import { createServices } from '../src/api/services.js'

function setup(storage){const server=createMockServer({storage,delay:0});const client=createApiClient({fetchImpl:server.fetch,getHeaders:()=>({Authorization:'Bearer test'})});return {server,client,api:createServices(client)}}
test('dashboard, details, plans and schedule use matching loan identifiers',async()=>{
  const {api}=setup(),list=await api.loans(),detail=await api.loan(list.loans[0].loan_id),dashboard=await api.dashboard(),schedule=await api.schedule({month:'2026-11'}),plans=await api.plans()
  assert.equal(dashboard.total_remaining_principal,detail.remaining_principal)
  assert.equal(schedule.due_items[0].loan_id,detail.loan_id)
  assert.equal(plans.plans[0].loan_id,detail.loan_id)
})
test('recording a payment refreshes loan, dashboard, monthly stats and persistent mock state; duplicate keys do not double-pay',async()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}
  const {api}=setup(storage),before=await api.loan(1)
  const body={loan_id:1,paid_at:'2026-11-15',amount:100000,payment_type:'EXTRA',due_item_id:null}
  const first=await api.createPayment(body,'same-request'),second=await api.createPayment(body,'same-request')
  assert.equal(first.payment.payment_id,second.payment.payment_id)
  assert.equal((await api.loan(1)).remaining_principal,before.remaining_principal-100000)
  const monthly=await api.monthly({from_month:'2026-11',to_month:'2026-11'})
  assert.equal(monthly.months[0].extra_amount,100000)
  assert.equal((await api.dashboard()).monthly_summary.actual_extra_amount,100000)
  assert.equal((await setup(storage).api.payments()).count,1)
})
test('preview does not mutate a plan; save changes subsequent GET',async()=>{
  const {api}=setup(),before=await api.plans(),body={plans:[{loan_id:1,mode:'EXTRA_AMOUNT',extra_monthly_payment:50000}]}
  const preview=await api.previewPlan(body)
  assert.equal(preview.proposed_plans[0].extra_monthly_payment,50000)
  assert.deepEqual(await api.plans(),before)
  await api.savePlan({...body,preview_version:preview.preview_version})
  assert.equal((await api.plans()).plans[0].extra_monthly_payment,50000)
})
test('regular payment separates basic principal, interest, and extra in the mock backend',async()=>{
  const {api}=setup(),saved=await api.createPayment({loan_id:1,paid_at:'2026-11-15',amount:380000,payment_type:'REGULAR',due_item_id:21},'regular')
  assert.equal(saved.payment.principal_amount,250000)
  assert.equal(saved.payment.interest_amount,30000)
  assert.equal(saved.payment.extra_amount,100000)
  const dashboard=await api.dashboard();assert.equal(dashboard.monthly_summary.completed_count,1);assert.equal(dashboard.monthly_summary.actual_extra_amount,100000)
})
test('settings updates persist and CSV downloads use the documented media type',async()=>{
  const {api}=setup();await api.updateProfile({name:'테스트'});assert.equal((await api.profile()).name,'테스트')
  await api.updateNotifications({rate_reset:false});assert.equal((await api.notifications()).rate_reset,false)
  const {blob,filename}=await api.exportData({format:'csv'});assert.equal(filename,'ronrun-export.csv');assert.match(await blob.text(),/record_type/)
  await assert.rejects(api.exportData({format:'json'}),e=>e.code==='INVALID_EXPORT_FORMAT')
})
test('invalid input, missing auth, and unknown paths surface typed failures',async()=>{
  const {api,server,client}=setup()
  await assert.rejects(api.createPayment({loan_id:1,paid_at:'2026-11-15',amount:-1,payment_type:'EXTRA'},'bad'),e=>e.code==='VALIDATION_ERROR'&&e.status===400)
  const unauthorized=createApiClient({fetchImpl:server.fetch});await assert.rejects(unauthorized.request('/api/dashboard/'),e=>e.code==='AUTH_REQUIRED'&&e.status===401)
  await assert.rejects(client.request('/api/missing/'),e=>e.status===404)
})
test('missing monthly records remain null rather than fake actual zero',async()=>{
  const {api}=setup(),monthly=await api.monthly({from_month:'2026-10',to_month:'2026-11'})
  assert.equal(monthly.months.length,2);assert.equal(monthly.months[0].actual_amount,null);assert.equal(monthly.months[0].data_status,'INSUFFICIENT')
})
