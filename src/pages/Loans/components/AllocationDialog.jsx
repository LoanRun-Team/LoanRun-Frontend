import { useState } from 'react'
import LoanDialog from './LoanDialog.jsx'
import AmountField from './AmountField.jsx'
import { allocationTotals,sameAllocation,strategyNames } from '../allocationModel.js'
import { won } from '../../../api/format.js'
import close from '../../../assets/loans/allocation-dialog-close.svg'
export default function AllocationDialog({rows,recommended,available,strategy,onClose,onSave,pending,error}) {
  const [draft,setDraft]=useState(()=>structuredClone(rows)),[dragging,setDragging]=useState(null)
  const totals=allocationTotals(draft,available),manual=!sameAllocation(draft,recommended)
  function move(from,to){if(from===to||from==null||to<0||to>=draft.length||draft[from]?.bullet||draft[to]?.bullet)return;setDraft(prev=>{const next=[...prev],[row]=next.splice(from,1);next.splice(to,0,row);return next})}
  return <LoanDialog title="이번 달 여유자금 배분" closeIcon={close} className="v3-allocation-dialog" onClose={onClose}><form onSubmit={e=>{e.preventDefault();if(!totals.invalid&&!pending)onSave(draft,totals,manual)}}>
    <div className="v3-allocation-heading"><span className={'lm-chip '+(manual?'manual':'')}>{manual?'직접 조정':'전략 추천 · '+(strategyNames[strategy]||'현재 전략')}</span><p>{manual?'전략 배분과 다르게 바꿨어요':'적립을 먼저 떼고, 현재 전략 순서로 배분했어요'}</p><p>월 여유자금 <strong>{won(available)}</strong></p></div>
    <fieldset disabled={pending} className="v2-fieldset"><div className="v3-allocation-rows">{draft.map((r,i)=><div key={r.loan_id} className="v3-allocation-row" data-loan-id={r.loan_id} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();move(dragging,i);setDragging(null)}}>
      <i className={'v3-loan-dot '+(r.bullet?'bullet':r.loan?.dto.loan_type==='MORTGAGE'?'mortgage':'credit')}/><div className="v3-allocation-name"><strong>{['①','②','③','④','⑤','⑥','⑦'][i]} {r.name}</strong><small>{r.bullet?'적립 · 매달 먼저':'추가 상환'}</small></div>
      <AmountField label={r.name+' 배분 금액'} value={r.amount} onChange={v=>setDraft(prev=>prev.map((row,j)=>j===i?{...row,amount:v}:row))} error={!r.bullet&&Number(r.amount)>r.balance?'남은 원금보다 많이 갚을 수 없어요':undefined}/>
      {r.bullet?<span className="v3-drag-spacer"/>:<button type="button" className="v3-drag-handle" draggable onDragStart={()=>setDragging(i)} onDragEnd={()=>setDragging(null)} aria-label={r.name+' 순서 변경'} title="끌어서 순서 변경 · 위/아래 방향키로 이동" onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();move(i,i+(e.key==='ArrowUp'?-1:1))}}}><span/><span/><span/></button>}
    </div>)}</div></fieldset>
    <div className="v3-allocation-sum"><span>합계</span><strong>배분 {won(totals.total)} / 남는 금액 {won(totals.reserve)}</strong></div>
    {totals.excess>0&&<p className="v3-allocation-warning">여유자금보다 <span>{won(totals.excess)}</span> 많아요. 그래도 이 금액으로 저장할 수 있어요</p>}
    {error&&<p className="field-error" role="alert">{error}</p>}
    <footer><button type="button" className="lm-text" disabled={pending||!manual} onClick={()=>setDraft(structuredClone(recommended))}>전략 배분으로 되돌리기</button><span/><button type="button" className="lm-button outline" disabled={pending} onClick={onClose}>취소</button><button className="lm-button primary" disabled={pending||totals.invalid}>{pending?'저장 중…':'저장'}</button></footer>
  </form></LoanDialog>
}
