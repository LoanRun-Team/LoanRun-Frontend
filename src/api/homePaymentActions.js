import { seoulToday } from './format.js'

const fields=['payment_id','loan_id','due_item_id','paid_at','payment_type','amount','principal_amount','extra_amount','interest_amount','fee_amount','savings_used_amount','created_at']
const signature=payment=>JSON.stringify(fields.map(key=>payment[key]??null))

// Keep receipts only for records created by this checkbox. A checked due may
// include other payments; never delete those based on the due id alone.
export function createHomePaymentActions(api,{storage,storageKey,today=seoulToday,makeKey=()=>crypto.randomUUID()}={}){
  const receipts=new Map(),requests=new Map()
  let busy=false
  try{
    const saved=JSON.parse(storageKey?storage?.getItem(storageKey)||'null':'null')
    if(saved?.version===1)for(const row of saved.receipts||[])if(Number.isSafeInteger(row.payment?.payment_id)&&Number.isSafeInteger(row.payment?.due_item_id))receipts.set(String(row.payment.due_item_id),row)
  }catch{/* Receipt storage is optional. */}
  function persist(){try{if(storageKey)storage?.setItem(storageKey,JSON.stringify({version:1,receipts:[...receipts.values()]}))}catch{/* Session memory remains available. */}}
  const canUndo=item=>receipts.get(String(item.due_item_id))?.payment.loan_id===item.loan_id
  async function toggle(item){
    if(busy)return {changed:false}
    busy=true
    try{
      const id=String(item.due_item_id),receipt=receipts.get(id)
      if(receipt){
        if(!canUndo(item))throw new Error('이 항목에서 등록한 납부 기록을 확인할 수 없어요.')
        let payment
        try{payment=await api.payment(receipt.payment.payment_id)}catch(error){if(error.status===404){receipts.delete(id);persist();return {changed:true,action:'deleted'}}throw error}
        if(payment.editable===false||signature(payment)!==signature(receipt.payment)){
          receipts.delete(id);persist()
          throw new Error('납부 기록이 변경되었거나 잠겨 있어요. 상환 내역에서 확인해 주세요.')
        }
        receipt.deleteKey??=makeKey();persist()
        await api.deletePayment(payment.payment_id,receipt.deleteKey)
        receipts.delete(id);persist()
        return {changed:true,action:'deleted'}
      }
      if(item.status==='PAID'||item.outstanding_amount===0)return {changed:false}
      if(!Number.isSafeInteger(item.loan_id)||item.loan_id<=0||!Number.isSafeInteger(item.due_item_id)||item.due_item_id<=0||!Number.isSafeInteger(item.outstanding_amount)||item.outstanding_amount<=0)throw new Error('남은 정기 납부액을 확인할 수 없어요.')
      if(!requests.has(id))requests.set(id,{key:makeKey(),body:{loan_id:item.loan_id,paid_at:today(),amount:item.outstanding_amount,payment_type:'REGULAR',due_item_id:item.due_item_id,savings_used_amount:0}})
      const request=requests.get(id)
      let result
      try{result=await api.createPayment(request.body,request.key)}catch(error){if(error.status>=400&&error.status<500)requests.delete(id);throw error}
      const payment=result.payment
      if(!Number.isSafeInteger(payment?.payment_id)||payment.loan_id!==item.loan_id||payment.due_item_id!==item.due_item_id||payment.amount!==request.body.amount||payment.paid_at!==request.body.paid_at||payment.payment_type!=='REGULAR')throw new Error('저장된 납부 기록을 확인할 수 없어요. 같은 항목을 다시 눌러 확인해 주세요.')
      receipts.set(id,{payment});requests.delete(id);persist()
      return {changed:true,action:'created'}
    }finally{busy=false}
  }
  return {toggle,canUndo}
}
