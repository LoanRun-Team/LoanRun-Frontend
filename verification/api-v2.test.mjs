import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createMockServer } from '../src/api/mock/server.js'
import { createApiClient } from '../src/api/client.js'
import { createServices } from '../src/api/services.js'
import { savingsView,loanView } from '../src/api/loanView.js'
import { paymentStatus } from '../src/pages/Home/components/paymentStatus.js'
function setup(){return createServices(createApiClient({fetchImpl:createMockServer({delay:0}).fetch,getHeaders:()=>({Authorization:'Bearer test'})}))}
async function bullet(api){const base=await api.loan(1);return api.createLoan({...base,repayment_method:'BULLET',product_name:'Bullet test',prepayment_policy:null,initial_savings_balance:100000,contractual_monthly_payment:30000})}
test('manually supplied principal, interest, extra and fees reach loan and schedule independently',async()=>{
  const api=setup(),before=await api.loan(1)
  const saved=await api.createPayment({loan_id:1,paid_at:'2026-11-15',amount:150000,payment_type:'REGULAR',due_item_id:21,principal_amount:110000,extra_amount:5000,interest_amount:30000,fee_amount:5000},'split')
  assert.equal(saved.payment.fee_amount,5000)
  assert.equal((await api.loan(1)).remaining_principal,before.remaining_principal-115000)
  const due=(await api.schedule({month:'2026-11'})).due_items[0]
  assert.equal(due.paid_required_amount,140000)
  assert.equal(due.paid_extra_amount,5000)
  await assert.rejects(api.createPayment({loan_id:1,paid_at:'2026-11-15',amount:150000,payment_type:'EXTRA',principal_amount:0,extra_amount:100000,interest_amount:0,fee_amount:0},'invalid-sum'),e=>e.code==='VALIDATION_ERROR')
})
test('savings CRUD changes savings without repaying principal; spending savings changes both exactly once',async()=>{
  const api=setup(),loan=await bullet(api),initial=loan.remaining_principal
  const created=await api.createSaving({loan_id:loan.loan_id,saved_at:'2026-11-15',amount:200000},'saving-add')
  assert.equal(created.savings_balance,300000)
  assert.equal((await api.loan(loan.loan_id)).remaining_principal,initial)
  await api.updateSaving(created.saving.saving_id,{amount:250000},'saving-update')
  const dto=await api.savings(loan.loan_id)
  assert.equal(dto.savings_balance,350000)
  assert.equal(dto.actual_saving_amount,250000)
  const view=savingsView(dto,loanView(await api.loan(loan.loan_id)))
  assert.equal(view.records[0].id,created.saving.saving_id)
  assert.equal(view.prepared,350000)
  assert.equal(view.comparisons.all.interestSaving,null)
  const body={loan_id:loan.loan_id,paid_at:'2026-11-15',amount:200000,payment_type:'EXTRA',due_item_id:null,principal_amount:0,extra_amount:200000,interest_amount:0,fee_amount:0,savings_used_amount:200000}
  await api.createPayment(body,'spend');await api.createPayment(body,'spend')
  assert.equal((await api.savings(loan.loan_id)).savings_balance,150000)
  assert.equal((await api.loan(loan.loan_id)).remaining_principal,initial-200000)
  await assert.rejects(api.deleteSaving(created.saving.saving_id,'used-delete'),e=>e.code==='VALIDATION_ERROR')
})
test('unused saving can be deleted and repeated keys never duplicate records',async()=>{
  const api=setup(),loan=await bullet(api),body={loan_id:loan.loan_id,saved_at:'2026-11-15',amount:100000}
  const a=await api.createSaving(body,'one'),b=await api.createSaving(body,'one')
  assert.equal(a.saving.saving_id,b.saving.saving_id)
  await assert.rejects(api.createSaving({...body,amount:2},'one'),e=>e.status===409)
  await api.deleteSaving(a.saving.saving_id,'remove')
  assert.equal((await api.savings(loan.loan_id)).results.length,0)
})
test('unpaid confirmation reaches the shared Home and Loans display state and can be cancelled',async()=>{
  const api=setup();await api.confirmDue(21,true,'confirm')
  let due=(await api.dashboard()).monthly_checklist[0]
  assert.equal(due.unpaid_confirmed,true)
  assert.equal(paymentStatus(due,'2026-11-30').key,'unpaid')
  await api.confirmDue(21,false,'cancel');due=(await api.schedule({month:'2026-11'})).due_items[0]
  assert.equal(paymentStatus(due,'2026-11-30').key,'unrecorded')
})
test('plan save requires the matching preview and completed loans are available via ALL',async()=>{
  const api=setup(),body={plans:[{loan_id:1,mode:'EXTRA_AMOUNT',extra_monthly_payment:20000}]}
  await assert.rejects(api.savePlan({...body,preview_version:'unknown'}),e=>e.status===409)
  const preview=await api.previewPlan(body);await api.savePlan({...body,preview_version:preview.preview_version})
  assert.equal((await api.plans(1)).plans[0].extra_monthly_payment,20000)
  const loan=await api.loan(1)
  await api.createPayment({loan_id:1,paid_at:'2026-11-15',amount:loan.remaining_principal,payment_type:'EXTRA'},'payoff')
  assert.equal((await api.loans()).count,0)
  assert.equal((await api.loans(undefined,'ALL')).loans[0].status,'PAID')
})
