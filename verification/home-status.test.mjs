import { test } from 'node:test'
import assert from 'node:assert/strict'
import { paymentStatus,extraStatus } from '../src/pages/Home/components/paymentStatus.js'
const due={required_amount:200000,paid_required_amount:0,planned_extra_amount:100000,paid_extra_amount:0,due_date:'2026-11-15',status:'UPCOMING'}
test('overdue without a record stays unrecorded; it is not silently marked unpaid',()=>{
  assert.equal(paymentStatus(due,'2026-11-17').key,'unrecorded')
  assert.equal(paymentStatus({...due,status:'UNPAID'},'2026-11-17').key,'unrecorded')
  assert.equal(paymentStatus({...due,status:'UNPAID'},'2026-11-17',{confirmedUnpaid:true}).key,'unpaid')
  assert.equal(paymentStatus(due,'2026-11-15').key,'upcoming')
})
test('partial status survives the API display_status UNPAID alias',()=>{
  assert.equal(paymentStatus({...due,status:'PARTIAL',display_status:'UNPAID',paid_required_amount:50000},'2026-11-17').key,'partial')
})
test('regular completion and extra goal are independent',()=>{
  const paid={...due,status:'PAID',paid_required_amount:200000,paid_extra_amount:50000}
  assert.equal(paymentStatus(paid,'2026-11-17').key,'paid')
  assert.equal(extraStatus(paid).key,'unachieved')
  assert.equal(extraStatus({...paid,paid_extra_amount:100000}).key,'achieved')
  assert.equal(extraStatus({...paid,planned_extra_amount:0}).key,'none')
})
