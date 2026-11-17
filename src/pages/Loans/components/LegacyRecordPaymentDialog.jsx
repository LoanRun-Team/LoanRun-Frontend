import { useState } from 'react'
import LoanDialog from './LoanDialog.jsx'
import { money } from '../data.js'
import { seoulToday } from '../../../api/format.js'
export default function RecordPaymentDialog({ loans, initial, onClose, onSave, pending, error }) {
  const [type,setType]=useState(initial.type)
  const [loanId,setLoanId]=useState(initial.loanId)
  const [date,setDate]=useState(seoulToday())
  const [amount,setAmount]=useState(initial.type==='regular'?(loans.find(l=>l.id===loanId)?.payment||200000):100000)
  const loan=loans.find(l=>l.id===loanId)
  return <LoanDialog title="납부 기록" onClose={onClose}><form aria-busy={pending} onSubmit={e=>{e.preventDefault();const paidAmount=Number(amount);if(!Number.isSafeInteger(paidAmount)||paidAmount<=0)return;onSave({loanId,date,amount:paidAmount,type})}}>{error&&<p className="inline-api-error" role="alert">{error}</p>}<fieldset disabled={pending} style={{border:0,padding:0,margin:0}}><div className="edit-tabs">{[['regular','정기 납부'],['extra','추가 상환']].map(([id,label])=><button type="button" key={id} className={type===id?'selected':''} onClick={()=>setType(id)}>{label}</button>)}</div><label className="lm-field"><span>대출</span><select value={loanId} onChange={e=>{setLoanId(e.target.value);if(type==='regular')setAmount(loans.find(l=>l.id===e.target.value).payment)}}>{loans.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label><label className="lm-field"><span>{type==='extra'?'날짜':'납부일'}</span><input type="date" max={seoulToday()} required value={date} onChange={e=>setDate(e.target.value)}/></label><label className="lm-field"><span>납부액</span><div className="payment-amount-field"><input name="amount" type="text" inputMode="numeric" pattern="[0-9,]+" required value={amount===''?'':money(amount)} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,''))}/><span aria-hidden="true">원</span></div></label><div className="form-inset"><p>기록될 내용</p><strong>{loan?.name || '대출 선택'} · {type==='regular'?'원리금':'추가 상환'} {money(amount)}원으로 기록돼요</strong></div><footer><button type="button" className="lm-button outline" onClick={onClose}>취소</button><button className="lm-button primary" disabled={pending||Number(amount)<=0||!Number.isSafeInteger(Number(amount))}>{pending?'저장 중…':'기록하기'}</button></footer></fieldset></form></LoanDialog>
}
