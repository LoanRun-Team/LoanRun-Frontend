import {test} from 'node:test'
import assert from 'node:assert/strict'
import {withRecordedPayments,monthlyRecords} from '../connectedViews.js'
import {planView,remainingCalendarMonths} from '../loanView.js'

test('recorded chart totals include paginated extras and fees without confirming an unobserved month',async()=>{
  const source={months:[{year_month:'2026-10',observed:false,actual_amount:null,principal_amount:null,interest_amount:null,extra_amount:null,target_amount:null},{year_month:'2026-11',observed:false,data_status:'INSUFFICIENT',actual_amount:null,principal_amount:null,interest_amount:null,extra_amount:null,target_amount:200}]}
  const calls=[],signal=new AbortController().signal
  const monthly=await withRecordedPayments({payments:async(query,s)=>{
    calls.push([query,s]);return {results:[{paid_at:'2026-11-20',amount:query.page===1?110:55,principal_amount:query.page===1?100:0,extra_amount:query.page===1?0:50,interest_amount:query.page===1?10:0,fee_amount:query.page===1?0:5}],next_page:query.page===1?2:null}
  }},source,7,signal)
  assert.equal(calls.length,2);assert.equal(calls[0][0].loan_id,7);assert.equal(calls[0][0].from,'2026-10-01');assert.equal(calls[1][0].to,'2026-11-30');assert.equal(calls[0][1],signal)
  assert.equal(monthly.months[0].actual_amount,null)
  const row=monthly.months[1]
  assert.equal(row.actual_amount,165);assert.equal(row.principal_amount,100);assert.equal(row.extra_amount,50);assert.equal(row.fee_amount,5)
  assert.equal(row.observed,false);assert.equal(row.data_status,'INSUFFICIENT');assert.equal(source.months[1].actual_amount,null)
  assert.equal(monthlyRecords(monthly).rows[1].extra,50)
  const plan=planView({plans:[],aggregate:{},progress:{difference:null,data_status:'INSUFFICIENT'}},monthly,{amount:165,principal_amount:100,extra_amount:50,interest_amount:10})
  assert.deepEqual(plan.periods,['2026-11']);assert.deepEqual(plan.principalRows,[150]);assert.deepEqual(plan.actual,[165]);assert.equal(plan.recordedOnly,true)
})

test('server-confirmed actuals win, missing plans stay unknown, and failure does not become zero',async()=>{
  const source={months:[{year_month:'2026-11',observed:true,data_status:'RECORDED',actual_amount:0,principal_amount:0,extra_amount:0,interest_amount:0,target_amount:null}]}
  const api={payments:async()=>({results:[{paid_at:'2026-11-20',amount:100,principal_amount:100,extra_amount:0,interest_amount:0,fee_amount:0}],next_page:null})}
  const monthly=await withRecordedPayments(api,source)
  assert.equal(monthly.months[0].actual_amount,0)
  const plan=planView({plans:[],aggregate:{},progress:{}},monthly,{amount:0,principal_amount:0,extra_amount:0,interest_amount:0})
  assert.deepEqual(plan.planned,[null])
  await assert.rejects(withRecordedPayments({payments:async()=>{throw Error('offline')}},source),/offline/)
})

test('remaining calendar months round up partial months and clamp month-end anniversaries',()=>{
  assert.equal(remainingCalendarMonths('2026-12-20','2026-11-20'),1)
  assert.equal(remainingCalendarMonths('2026-12-21','2026-11-20'),2)
  assert.equal(remainingCalendarMonths('2027-02-28','2027-01-31'),1)
  assert.equal(remainingCalendarMonths('2026-11-21','2026-11-20'),1)
  assert.equal(remainingCalendarMonths('2026-11-19','2026-11-20'),0)
  assert.equal(remainingCalendarMonths(null,'2026-11-20'),null)
})
