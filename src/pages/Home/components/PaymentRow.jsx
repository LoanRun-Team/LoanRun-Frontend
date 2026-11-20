import { won, seoulToday } from '../../../api/format.js'
import { paymentStatus, extraStatus } from './paymentStatus.js'
import checkIcon from '../../../assets/home/payment-complete-check.svg'

export default function PaymentRow({item,onRecord,onToggle,canUndo=false,today=seoulToday(),confirmedUnpaid=false,readOnly=false}) {
  const status=paymentStatus(item,today,{confirmedUnpaid}),extra=extraStatus(item)
  const date=item.due_date?Number(item.due_date.slice(5,7))+'/'+Number(item.due_date.slice(8,10)):'—'
  return <li className="home-payment-row" data-status={status.key}>
    <button type="button" className={'payment-mark '+(status.key==='paid'?'is-paid':'')} aria-pressed={status.key==='paid'} aria-label={item.product_name+(status.key==='paid'?(canUndo?' 납부 완료 취소':' 납부 완료'):' 납부 완료 처리')} disabled={readOnly||!(onToggle||onRecord)||status.key==='paid'&&!canUndo} onClick={()=>onToggle?onToggle(item):onRecord(item)}>{status.key==='paid'&&<img src={checkIcon} alt=""/>}</button>
    <time dateTime={item.due_date}>{date}</time>
    <div className="home-payment-loan"><strong title={item.product_name}>{item.product_name}</strong><span className="neutral-chip">원리금</span></div>
    <div className="home-payment-details">
      <div className="home-payment-line"><strong>정기 납부 {won(item.required_amount)}</strong>
        {status.key==='partial'&&<span className="payment-remaining">남은 {won(item.outstanding_amount)}</span>}
        <span className={'home-status-chip '+status.key}>{status.key==='unrecorded'&&<span className="status-question" aria-hidden="true">?</span>}{status.label}</span>
        {['unrecorded','unpaid'].includes(status.key)&&<button disabled={readOnly} className="text-button record-link" onClick={()=>onRecord(item)}>기록하기</button>}
      </div>
      <div className="home-payment-line extra-line"><span>{extra.key==='none'?'추가 상환 목표 없음':'추가 상환 목표 '+won(item.planned_extra_amount)+' · 기록 '+won(item.paid_extra_amount)}</span><span className={'home-status-chip '+extra.key}>{extra.label}</span></div>
    </div>
  </li>
}
