import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decorateLoan } from '../src/pages/Loans/loanPresentation.js'
import { designPreview,updateSavingsPreview } from '../src/api/mock/loanDesignPreview.js'
import { createMockServer } from '../src/api/mock/server.js'
import { createApiClient } from '../src/api/client.js'
import { createServices } from '../src/api/services.js'
const api=()=>createServices(createApiClient({fetchImpl:createMockServer({delay:0}).fetch,getHeaders:()=>({Authorization:'Bearer mock'})}))
test('grace, repayment and completed stages remain distinct',()=>{
  const loan={balance:7000000,dto:{status:'ACTIVE',repayment_method:'GRACE_INSTALLMENT',start_date:'2025-09-15',grace_months:18}}
  assert.equal(decorateLoan(loan,'2026-11-17').stage,'grace')
  assert.equal(decorateLoan(loan,'2027-04-01').stage,'active')
  assert.equal(decorateLoan({...loan,balance:0},'2026-11-17').stage,'paid')
})
test('savings are separate from loan repayment; changed savings invalidate old comparison quotes',()=>{
  const initial=designPreview('bullet').savings
  const next=updateSavingsPreview(initial,{id:'new',date:'2026-11-17',amount:100000})
  assert.equal(next.prepared-initial.prepared,100000)
  assert.equal(next.records[0].amount,100000)
  assert.equal(initial.records.length,2)
  assert.equal(next.comparisons.all.interestSaving,null)
  assert.equal(next.comparisons.all.amount,next.prepared)
})
test('loan quote allocation matches the contractual amount used by the payment form',async()=>{
  const service=api(),loan=await service.loan(1)
  const quote=await service.previewLoan({...loan,contractual_monthly_payment:199954})
  assert.equal(quote.estimated_next_principal+quote.estimated_next_interest,199954)
})
test('an extra payment updates the plan status response without changing a regular payment completion',async()=>{
  const service=api()
  await service.createPayment({loan_id:1,paid_at:'2026-11-15',amount:100000,payment_type:'EXTRA',due_item_id:null},'extra-status')
  const plans=await service.plans(1),dashboard=await service.dashboard()
  assert.equal(plans.plans[0].actual_extra_amount,100000)
  assert.equal(plans.plans[0].extra_gap_amount,0)
  assert.equal(dashboard.monthly_summary.completed_count,0)
})
test('deleting a managed loan removes its related mock plans and payments',async()=>{
  const service=api();await service.deleteLoan(1)
  assert.equal((await service.loans()).count,0)
  assert.equal((await service.plans()).plans.length,0)
  await assert.rejects(service.loan(1),e=>e.code==='LOAN_NOT_FOUND')
})
