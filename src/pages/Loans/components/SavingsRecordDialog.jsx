import { useState } from 'react'
import LoanDialog from './LoanDialog.jsx'
import AmountField from './AmountField.jsx'
import { v2Icons } from '../v2Icons.js'
import { seoulToday } from '../../../api/format.js'
export default function SavingsRecordDialog({loans,initial,onClose,onSave,pending,error}) {
  const [loanId,setLoanId]=useState(initial.loanId),[date,setDate]=useState(initial.record?.date||seoulToday()),[amount,setAmount]=useState(initial.record?.amount||''),[memo,setMemo]=useState(initial.record?.memo||'')
  return <LoanDialog title="상환자금 적립 기록" onClose={onClose} closeIcon={v2Icons.close} className="v2-savings-dialog"><form aria-busy={pending} onSubmit={e=>{e.preventDefault();if(!pending&&Number(amount)>0)onSave({id:initial.record?.id,loanId,date,amount:Number(amount),memo})}}><fieldset disabled={pending} className="v2-fieldset">
    {error&&<p className="field-error" role="alert">{error}</p>}
    <label className="lm-field"><span>대출</span><select disabled={Boolean(initial.record)} value={loanId} onChange={e=>setLoanId(e.target.value)}>{loans.filter(l=>l.dto.repayment_method==='BULLET').map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
    <label className="lm-field"><span>날짜</span><input type="date" value={date} max={seoulToday()} required onChange={e=>setDate(e.target.value)}/></label>
    <AmountField name="savings-amount" label="금액" value={amount} onChange={setAmount} required/>
    <label className="lm-field"><span>메모 (선택)</span><input disabled value={memo} placeholder="메모 저장 준비 중" onChange={e=>setMemo(e.target.value)}/></label>
    <p className="form-notice"><img src={v2Icons.info} alt=""/>적립금은 대출 잔액을 줄이지 않아요. 실제로 갚을 때 납부 기록에서 사용할 수 있어요</p>
    <footer><button type="button" className="lm-button outline" onClick={onClose}>취소</button><button className="lm-button primary" disabled={!Number.isSafeInteger(Number(amount))||Number(amount)<=0}>기록하기</button></footer>
  </fieldset></form></LoanDialog>
}
