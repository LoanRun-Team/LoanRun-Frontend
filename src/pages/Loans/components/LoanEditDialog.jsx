import { useState } from 'react'
import LoanDialog from './LoanDialog.jsx'
import AmountField from './AmountField.jsx'

export default function LoanEditDialog({loan,onSave,onClose,pending,error}){
  const [draft,setDraft]=useState(()=>({product_name:loan.name,institution_name:loan.bank,remaining_principal:loan.balance,payment_day:loan.day,contractual_monthly_payment:loan.dto.contractual_monthly_payment??''}))
  const change=(key,value)=>setDraft(previous=>({...previous,[key]:value}))
  return <LoanDialog title="대출 정보 수정" onClose={onClose}><form onSubmit={event=>{event.preventDefault();if(pending)return;const body={};for(const [key,value] of Object.entries(draft)){const old=loan.dto[key]??'';if(String(value)!==String(old))body[key]=['remaining_principal','payment_day','contractual_monthly_payment'].includes(key)?value===''?null:Number(value):value}onSave(body)}}>
    {error&&<p role="alert">{error}</p>}<fieldset className="v2-fieldset" disabled={pending}>
      {loan.dto.product_id==null&&['product_name','institution_name'].map(key=><label className="lm-field" key={key}><span>{key==='product_name'?'대출 이름':'금융기관'}</span><input required value={draft[key]} onChange={event=>change(key,event.target.value)}/></label>)}
      <AmountField label="현재 남은 원금" value={draft.remaining_principal} onChange={value=>change('remaining_principal',value)} required/>
      <label className="lm-field"><span>납부일</span><select value={draft.payment_day} onChange={event=>change('payment_day',event.target.value)}>{Array.from({length:31},(_,i)=><option value={i+1} key={i}>{i+1}일</option>)}</select></label>
      <AmountField label="은행에서 안내한 다음 납부액 (선택)" value={draft.contractual_monthly_payment} onChange={value=>change('contractual_monthly_payment',value)}/>
      <footer><button type="button" className="lm-button outline" onClick={onClose}>취소</button><button className="lm-button primary">저장</button></footer>
    </fieldset>
  </form></LoanDialog>
}
