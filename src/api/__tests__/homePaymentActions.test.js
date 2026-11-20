import test from 'node:test'
import assert from 'node:assert/strict'
import { createHomePaymentActions } from '../homePaymentActions.js'

const due=()=>({due_item_id:301,loan_id:9041,status:'PARTIAL',required_amount:100000,paid_required_amount:30000,outstanding_amount:70000})
const paid=item=>({...item,status:'PAID',paid_required_amount:100000,outstanding_amount:0})
function fixture(){
  const calls=[];let current
  const api={
    createPayment:async(body,key)=>{calls.push({method:'POST',body,key});current={...body,payment_id:8402,principal_amount:60000,extra_amount:0,interest_amount:10000,fee_amount:0,editable:true,created_at:'2026-11-20T12:00:00+09:00'};return {payment:{...current}}},
    payment:async id=>{calls.push({method:'GET',id});return {...current}},
    deletePayment:async(id,key)=>{calls.push({method:'DELETE',id,key});return {deleted:true}},
  }
  return {api,calls,current:()=>current}
}
const options={today:()=> '2026-11-20',makeKey:()=>crypto.randomUUID()}

test('checkbox records only the remaining regular due, dated today, without invented components or extra target',async()=>{
  const {api,calls}=fixture(),item={...due(),planned_extra_amount:200000}
  const actions=createHomePaymentActions(api,options)
  assert.deepEqual(await actions.toggle(item),{changed:true,action:'created'})
  assert.deepEqual(calls[0].body,{loan_id:9041,paid_at:'2026-11-20',amount:70000,payment_type:'REGULAR',due_item_id:301,savings_used_amount:0})
  assert.ok(calls[0].key);assert.equal(actions.canUndo(paid(item)),true)
  assert.equal(item.status,'PARTIAL') // UI must re-read the actual server state.
})

test('unchecking verifies and deletes only the payment created by this checkbox',async()=>{
  const {api,calls}=fixture(),item=due(),actions=createHomePaymentActions(api,options)
  await actions.toggle(item)
  assert.deepEqual(await actions.toggle(paid(item)),{changed:true,action:'deleted'})
  assert.equal(calls[1].method,'GET');assert.equal(calls[1].id,8402)
  assert.equal(calls[2].method,'DELETE');assert.equal(calls[2].id,8402)
  assert.ok(calls[2].key);assert.equal(actions.canUndo(item),false)
})

test('already paid dues without a local receipt never delete pre-existing payment records',async()=>{
  const {api,calls}=fixture(),actions=createHomePaymentActions(api,options)
  assert.equal(actions.canUndo(paid(due())),false)
  assert.deepEqual(await actions.toggle(paid(due())),{changed:false})
  assert.equal(calls.length,0)
})

test('duplicate clicks while a request is pending send only one POST',async()=>{
  const {api,calls}=fixture(),original=api.createPayment;let release
  const ready=new Promise(resolve=>{release=resolve})
  api.createPayment=async(...args)=>{await ready;return original(...args)}
  const actions=createHomePaymentActions(api,options),first=actions.toggle(due())
  assert.deepEqual(await actions.toggle(due()),{changed:false})
  release();await first;assert.equal(calls.filter(c=>c.method==='POST').length,1)
})

test('network retry retains the exact request body and idempotency key without checking success prematurely',async()=>{
  const {api}=fixture(),original=api.createPayment,requests=[];let first=true,day='2026-11-20'
  api.createPayment=async(body,key)=>{requests.push({body:{...body},key});if(first){first=false;throw Object.assign(new Error('lost response'),{kind:'network'})}return original(body,key)}
  const actions=createHomePaymentActions(api,{...options,today:()=>day})
  await assert.rejects(()=>actions.toggle(due()),/lost response/)
  assert.equal(actions.canUndo(due()),false)
  day='2026-11-21';await actions.toggle(due())
  assert.deepEqual(requests[1],requests[0]);assert.equal(requests[1].body.paid_at,'2026-11-20')
})

test('successful receipts survive a reload in the same user-scoped session storage',async()=>{
  const {api,calls}=fixture(),saved=new Map(),storage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)}
  const config={...options,storage,storageKey:'loanrun.quick-payments:42'}
  await createHomePaymentActions(api,config).toggle(due())
  const restored=createHomePaymentActions(api,config)
  assert.equal(restored.canUndo(paid(due())),true)
  assert.equal(createHomePaymentActions(api,{...config,storageKey:'loanrun.quick-payments:43'}).canUndo(paid(due())),false)
  await restored.toggle(paid(due()));assert.equal(calls.at(-1).method,'DELETE')
})

test('edited or locked records are not silently deleted by the checkbox',async()=>{
  for(const changed of [{amount:90000},{editable:false}]){
    const {api,calls,current}=fixture(),actions=createHomePaymentActions(api,options)
    await actions.toggle(due());api.payment=async()=>({...current(),...changed})
    await assert.rejects(()=>actions.toggle(paid(due())),/변경되었거나 잠겨/)
    assert.equal(calls.some(c=>c.method==='DELETE'),false)
    assert.equal(actions.canUndo(due()),false)
  }
})

test('failed deletion retains its receipt and key; already-deleted records are refreshed without another write',async()=>{
  const {api}=fixture(),keys=[],actions=createHomePaymentActions(api,options)
  await actions.toggle(due());let fail=true
  api.deletePayment=async(id,key)=>{keys.push(key);if(fail){fail=false;throw Object.assign(new Error('unavailable'),{status:503})}return {deleted:true}}
  await assert.rejects(()=>actions.toggle(paid(due())),{status:503})
  assert.equal(actions.canUndo(due()),true)
  await actions.toggle(paid(due()));assert.equal(keys[0],keys[1])
  await actions.toggle(due());api.payment=async()=>{throw Object.assign(new Error('not found'),{status:404})}
  assert.deepEqual(await actions.toggle(paid(due())),{changed:true,action:'deleted'})
})
