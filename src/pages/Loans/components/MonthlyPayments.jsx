import { useState } from 'react'
import LoanFilter from './LoanFilter.jsx'
import { won, seoulToday } from '../../../api/format.js'
import { v2Icons } from '../v2Icons.js'
import { clampPercent } from '../../../components/Charts/chartGeometry.js'
import { paymentStatus,extraStatus } from '../../Home/components/paymentStatus.js'
function ScheduleRow({item,loan,onRecord,onConfirm,confirmedUnpaid,readOnly=false}) {
  const status=paymentStatus(item,seoulToday(),{confirmedUnpaid}),extra=extraStatus(item)
  const interestOnly=loan?.dto.repayment_method==='BULLET'||loan?.stage==='grace'
  return <div className={"v2-schedule-row"+(loan?.dto.repayment_method==='BULLET'?' is-bullet':'')} data-status={status.key}>
    <time dateTime={item.due_date}>{item.due_date?.slice(5).replace('-','.')} ({['일','월','화','수','목','금','토'][new Date(item.due_date+'T00:00:00+09:00').getDay()]})</time>
    <span className="v2-schedule-name" title={loan?.name||item.product_name}>{loan?.name||item.product_name}<span className="lm-chip">{interestOnly?'이자만':'원리금'}</span></span>
    <div className="v2-payment-right"><div><strong>{interestOnly?'이자':'정기'} 납부 {won(item.required_amount)}</strong>{status.key==='partial'&&<span className="warning">남은 {won(item.outstanding_amount)}</span>}<span className={'v2-status '+status.key}>{status.key==='unrecorded'&&<span aria-hidden="true" className="question-mark">?</span>}{status.label}</span>{['unrecorded','unpaid'].includes(status.key)&&<button className="lm-text" disabled={readOnly} onClick={()=>onConfirm(item)}>기록하기</button>}</div>
    {loan?.dto.repayment_method!=='BULLET'&&<div className="v2-extra-line"><span>{extra.key==='none'?'추가 상환 목표 없음':'추가 상환 목표 '+won(item.planned_extra_amount)+' · 기록 '+won(item.paid_extra_amount)}</span><span className={'v2-status '+extra.key}>{extra.label}</span></div>}</div>
    <button disabled={readOnly} className="row-hit-target" aria-label={(loan?.name||item.product_name)+' 납부 기록'} onClick={()=>onRecord({type:'regular',loanId:String(item.loan_id)})}/>
  </div>
}
export default function MonthlyPayments({loans,filter,onFilter,month,onMonth,schedule,payments,onRecord,onConfirm,onSavings,savings,confirmations={},readOnly=false}) {
  const [day,setDay]=useState(9)
  const [year,monthNumber]=month.split('-').map(Number)
  const date=new Date(year,monthNumber-1,1),count=new Date(year,monthNumber,0).getDate()
  const due=schedule.due_items,summary=schedule.monthly_totals
  const extras=payments.filter(p=>p.extra_amount>0&&p.paid_at.startsWith(month))
  const selected=due.filter(d=>Number(d.due_date.slice(8))===day)
  const visible=loans.filter(l=>filter==='all'||l.id===filter)
  const bullet=visible.length===1&&visible[0].dto.repayment_method==='BULLET'
  function move(offset){const d=new Date(year,monthNumber-1+offset,1);onMonth(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));setDay(1)}
  function record(item){onRecord({type:'regular',loanId:String(item?.loan_id||visible[0]?.id||loans[0]?.id||'')})}
  const next=due.find(d=>Number(d.due_date.slice(8))>day)
  return <div className="monthly-layout"><section className="lm-card repayment-calendar"><h2>상환 캘린더</h2><LoanFilter loans={loans} value={filter} onChange={onFilter}/>
    <div className="calendar-heading"><strong>{year}년 {monthNumber}월</strong><div><button aria-label="이전 달" onClick={()=>move(-1)}><img src={v2Icons.previous} alt=""/></button><button aria-label="다음 달" onClick={()=>move(1)}><img src={v2Icons.next} alt=""/></button></div></div>
    <div className="calendar-weekdays">{['일','월','화','수','목','금','토'].map(d=><span key={d}>{d}</span>)}</div>
    <div className="calendar-days">{Array.from({length:date.getDay()},(_,i)=><span key={'b'+i}/>)}{Array.from({length:count},(_,i)=>i+1).map(d=><button key={d} className={(day===d?'selected ':'')+((date.getDay()+d-1)%7===0?'sunday':'')} aria-label={monthNumber+'월 '+d+'일'} aria-pressed={day===d} onClick={()=>setDay(d)}><span>{d}</span>{schedule.calendar_events.some(e=>Number(e.date.slice(8))===d)&&<img src={v2Icons.paymentMarker} alt="정기 납부"/>}{extras.some(p=>Number(p.paid_at.slice(8))===d)&&<img src={v2Icons.extraMarker} alt="추가 상환"/>}</button>)}</div>
    <div className="calendar-legend">{[[v2Icons.regularLegend,'정기 납부'],[v2Icons.extraLegend,bullet?'상환자금 적립':'추가 상환'],[v2Icons.overdueLegend,'미납']].map(([src,label])=><span key={label}><img src={src} alt=""/>{label}</span>)}</div>
    <div className="selected-day"><div><strong>{monthNumber}월 {day}일 ({['일','월','화','수','목','금','토'][new Date(year,monthNumber-1,day).getDay()]})</strong><span>일정 {selected.length}건</span></div><div className="day-details">{selected.length?selected.map(d=><button className="lm-text" key={d.due_item_id} disabled={readOnly} onClick={()=>record(d)}>{d.product_name} · {won(d.required_amount)} · 납부 기록</button>):<><p>이 날은 예정된 일정이 없어요</p>{next&&<small>다음 일정 {next.due_date.slice(5).replace('-','.')} {next.product_name} 정기 납부 {won(next.required_amount)}</small>}</>}</div></div>
  </section><div className="monthly-schedule"><section className="lm-card monthly-progress"><strong>이번 달 {bullet?'이자 납부':'정기 납부'} {won(summary.scheduled_repayment)} 중 {won(due.reduce((sum,item)=>sum+item.paid_required_amount,0))} 완료</strong><div className="payment-stack"><span style={{width:clampPercent(summary.scheduled_repayment?due.reduce((sum,item)=>sum+item.paid_required_amount,0)/summary.scheduled_repayment*100:0)+'%'}}/></div><p>{bullet?'상환자금 적립':'추가 상환'} 목표 {won(bullet?savings?.monthlyTarget:summary.planned_extra_amount)} 중 {won(bullet?savings?.monthlyActual:summary.actual_extra_amount)} 기록</p></section>
    <header className="monthly-schedule-heading"><h2>이번 달 상환 일정</h2><div className="v2-actions"><button disabled={readOnly||!loans.length} className="lm-button outline small" onClick={()=>record(due[0])}>납부 기록하기</button>{bullet&&<button className="lm-button outline small" disabled={readOnly} onClick={()=>onSavings(visible[0])}>상환자금 적립 기록하기</button>}</div></header>
    <section className="lm-card schedule-card"><header><strong>{bullet?'이자 납부(정기)':'대출별 이번 달 상환'}</strong><span>{bullet?'매월 자동':'정기 납부 · 추가 상환 목표'}</span></header>{due.length?due.map(d=><ScheduleRow readOnly={readOnly} key={d.due_item_id} item={d} loan={loans.find(l=>l.id===String(d.loan_id))} onRecord={onRecord} onConfirm={onConfirm} confirmedUnpaid={confirmations[month+':'+d.due_item_id]==='unpaid'}/>):<p className="empty-schedule">등록된 정기 납부가 없어요</p>}
      <header className="extra-heading"><strong>{bullet?'상환자금 적립':'추가 상환 기록'}</strong><span>목표 {won(bullet?savings?.monthlyTarget:summary.planned_extra_amount)} · 기록 {won(bullet?savings?.monthlyActual:summary.actual_extra_amount)}</span></header>
      {bullet?<div className="scheduled-payment"><time>{monthNumber}월</time><span>{visible[0]?.name}</span><strong>적립 {won(savings?.monthlyActual)}</strong><span className="payment-state">{savings?.monthlyActual>0?'기록됨':'기록 전'}</span>{savings?.shortfall>0&&<button className="lm-text" disabled={readOnly} onClick={()=>onSavings(visible[0],'shortfall')}>미적립 {won(savings.shortfall)} · 자세히 보기</button>}</div>:extras.map(p=><div className="scheduled-payment" key={p.payment_id}><time>{p.paid_at.slice(5).replace('-','.')}</time><span>{loans.find(l=>Number(l.id)===p.loan_id)?.name}</span><strong>{won(p.extra_amount)}</strong><span className="payment-state">기록됨</span></div>)}
    </section>
  </div></div>
}
