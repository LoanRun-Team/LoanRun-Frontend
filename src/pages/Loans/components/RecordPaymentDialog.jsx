import { useState } from 'react'
import LegacyRecordPaymentDialog from './LegacyRecordPaymentDialog.jsx'
import LoanDialog from './LoanDialog.jsx'
import AmountField from './AmountField.jsx'
import ApiState from '../../../components/ApiState/ApiState.jsx'
import { services } from '../../../api/runtime.js'
import { useApiResource } from '../../../api/useApiResource.js'
import { won,seoulToday } from '../../../api/format.js'
import { v2Icons } from '../v2Icons.js'

export default function RecordPaymentDialog(props) {
  return props.designV2?<PaymentForm {...props}/>:<LegacyRecordPaymentDialog {...props}/>
}
function PaymentForm({loans,initial,onClose,onSave,pending,error}) {
  const [type,setType]=useState(initial.type||'regular'),[loanId,setLoanId]=useState(initial.loanId||loans[0]?.id||''),[date,setDate]=useState(seoulToday()),[amount,setAmount]=useState(initial.amount??loans.find(l=>l.id===initial.loanId)?.payment??''),[details,setDetails]=useState({}),[memo,setMemo]=useState(''),[usedSavings,setUsedSavings]=useState(''),[feeKnown,setFeeKnown]=useState(true)
  const loan=loans.find(l=>l.id===loanId),bullet=loan?.dto.repayment_method==='BULLET'
  const quote=useApiResource(loanId,signal=>loan?services.previewLoan(loan.dto,signal):Promise.resolve(null))
  const breakdown={principal:type==='extra'?0:quote.data?.estimated_next_principal??0,extra:type==='extra'?Number(amount)||0:0,interest:type==='extra'?0:quote.data?.estimated_next_interest??0,fee:0,...details}
  const detailSum=Object.values(breakdown).reduce((n,v)=>n+(Number(v)||0),0)
  const total=Number(amount),mismatch=!bullet&&Number.isFinite(total)&&detailSum!==total
  const principalReduction=(Number(breakdown.principal)||0)+(Number(breakdown.extra)||0)
  function chooseType(next){setType(next);setDetails({});if(next==='extra')setAmount(initial.amount||'')}
  function submit(e){e.preventDefault();if(mismatch||!Number.isSafeInteger(total)||total<=0)return;const parts=bullet?{principal:0,extra:type==='extra'?total:0,interest:type==='regular'?total:0,fee:0}:Object.fromEntries(Object.entries(breakdown).map(([k,v])=>[k,Number(v)||0]));onSave({loanId,date,amount:total,type,memo,breakdown:parts,usedSavings:Number(usedSavings)||0,feeKnown})}
  return <LoanDialog title="납부 기록" onClose={onClose} closeIcon={v2Icons.close} className="v2-record-dialog"><form onSubmit={submit} aria-busy={pending}><fieldset className="v2-fieldset" disabled={pending}>
    {error&&<p className="field-error" role="alert">{error}</p>}
    <div className="edit-tabs">{(bullet?[['regular','이자 납부'],['extra','원금 상환']]:[['regular','정기 납부'],['extra','추가 상환']]).map(([id,label])=><button type="button" key={id} aria-pressed={type===id} className={type===id?'selected':''} onClick={()=>chooseType(id)}>{label}</button>)}</div>
    <label className="lm-field"><span>대출</span>{type==='regular'?<span className="lm-chip">{loan?.name} · {loan?.day}일 예정</span>:<select aria-label="대출" value={loanId} onChange={e=>{setLoanId(e.target.value);setDetails({})}}>{loans.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select>}</label>
    <label className="lm-field"><span>{type==='regular'?'납부일':'날짜'}</span><input type="date" required max={seoulToday()} value={date} onChange={e=>setDate(e.target.value)}/></label>
    <AmountField name="amount" label={bullet?(type==='extra'?'상환 원금':'납부 이자'):'총 납부액'} value={amount} onChange={setAmount} required/>
    {bullet?<>{type==='extra'&&<AmountField label="적립금에서 사용한 금액 (선택)" value={usedSavings} onChange={setUsedSavings} helper="입력하면 마련한 상환자금에서 함께 빠져요"/>}<dl className="v2-key-values"><div><dt>예상 중도상환수수료</dt><dd><span className="lm-chip">수수료 미반영</span></dd></div></dl></>:<>
      <section className="v2-inset payment-breakdown"><h3>세부 내역</h3><p>은행 납부 내역과 다르면 직접 고쳐 주세요</p><ApiState status={quote.status} error={quote.error} onRetry={quote.reload}/>
      <div className="loan-form-grid">{[['principal','정기 상환 원금'],['extra','추가 상환 원금'],['interest','이자'],['fee','수수료']].map(([key,label])=><AmountField key={key} name={'detail-'+key} label={label} value={breakdown[key]} onChange={v=>{setDetails(prev=>({...prev,[key]:v}));if(key==='fee')setFeeKnown(v!=='')}}/>)}</div>
      <div className={'breakdown-summary '+(mismatch?'field-error':'')}><span>세부 합계</span><strong>{won(detailSum)} / 총 납부액 {won(total)}</strong></div>
      {mismatch&&<p className="field-error" role="alert">세부 금액의 합이 총 납부액과 같아야 해요</p>}
      <div className="breakdown-summary"><span>원금 감소 (정기 원금 + 추가 원금)</span><strong className="teal">{won(principalReduction)}</strong></div>
      {!feeKnown&&<p className="field-helper">수수료 미반영 · 실제 납부 내역에서 확인해 주세요</p>}
      </section>
      {type==='extra'?<><label className="lm-field"><span>메모 (선택)</span><input disabled value={memo} placeholder="예: 상여금" onChange={e=>setMemo(e.target.value)}/></label><section className="v2-inset payment-result"><p>예상 효과</p><strong>상환 기록 후 변경된 상환 계획에서 확인해 주세요</strong></section></>:<section className="v2-inset payment-result"><p>기록될 내용</p><div className="v2-actions"><span className="lm-chip">{total<(loan?.payment||0)?'부분 납부':total===(loan?.payment||0)?'계획대로':'추가 납부'}</span></div><strong>{mismatch?'세부 금액을 고치면 합계가 총 납부액과 같아야 저장할 수 있어요':total<(loan?.payment||0)?'납부한 금액만큼 부분 납부로 기록돼요':won(total)+'으로 납부 기록을 저장해요'}</strong></section>}
    </>}
    <footer><button type="button" className="lm-button outline" onClick={onClose}>취소</button><button className="lm-button primary" disabled={pending||mismatch||total<=0||!Number.isSafeInteger(total)}>{pending?'저장 중…':'기록하기'}</button></footer>
  </fieldset></form></LoanDialog>
}
