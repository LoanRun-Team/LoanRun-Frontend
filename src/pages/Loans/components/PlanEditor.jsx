import { useState } from 'react'
import { services as defaultServices } from '../../../api/runtime.js'
import { useApiResource } from '../../../api/useApiResource.js'
import { errorMessage } from '../../../api/ApiError.js'
import { won,monthLabel,seoulToday } from '../../../api/format.js'
import ApiState from '../../../components/ApiState/ApiState.jsx'
import AmountField from './AmountField.jsx'
import { v2Icons } from '../v2Icons.js'
import { icons } from '../icons.js'
export default function PlanEditor({loanIds,loans=[],onSaved,onCancel,budgetWarning,scenario,api=defaultServices}) {
  const selected=loans.filter(l=>loanIds.includes(Number(l.id)))
  const initialDate=selected[0]?.dto.plan?.target_payoff_date||selected[0]?.dto.maturity_date||seoulToday()
  const [mode,setMode]=useState(scenario==='plan-amount-warning'?'EXTRA_AMOUNT':'TARGET_DATE'),[extra,setExtra]=useState(selected[0]?.dto.plan?.extra_monthly_payment??0),[year,setYear]=useState(Number(initialDate.slice(0,4))),[month,setMonth]=useState(Number(initialDate.slice(5,7))),[preference,setPreference]=useState('BALANCED'),[pending,setPending]=useState(false),[error,setError]=useState('')
  const date=year+'-'+String(month).padStart(2,'0')+'-01'
  const maturity=selected.map(l=>l.dto.maturity_date).filter(Boolean).sort()[0]
  const invalid=mode==='TARGET_DATE'&&Boolean(maturity&&date>maturity)
  const body={plans:loanIds.map(loan_id=>({loan_id,mode,...(mode==='EXTRA_AMOUNT'?{extra_monthly_payment:Number(extra)}:mode==='TARGET_DATE'?{target_date:date}:{preference})}))}
  const resource=useApiResource(JSON.stringify(body)+invalid,async signal=>{
    if(invalid||!loanIds.length)return null
    await new Promise(resolve=>setTimeout(resolve,250));if(signal.aborted)throw new DOMException('Aborted','AbortError')
    return api.previewPlan(body,signal)
  })
  const preview=resource.status==='success'&&!invalid?resource.data:null
  const current=preview?.current_plans||selected.map(l=>l.dto.plan).filter(Boolean)
  const sum=(plans,key)=>plans?.length?plans.reduce((n,p)=>n+(p[key]||0),0):null
  const proposed=preview?.proposed_plans
  const warning=budgetWarning||preview?.warnings?.find(w=>typeof w==='string'&&w.includes('여유자금'))
  const compareDate=current?.map(p=>p.estimated_payoff_date).filter(Boolean).sort().at(-1)
  async function save(){if(!preview||invalid)return;setPending(true);setError('');try{await api.savePlan({...body,preview_version:preview.preview_version});onSaved()}catch(e){setError(errorMessage(e))}finally{setPending(false)}}
  const yearStart=Number(seoulToday().slice(0,4)),yearEnd=Math.max(Number(maturity?.slice(0,4)||yearStart)+5,year+2)
  return <>
    <div className="edit-tabs" role="group" aria-label="계획 수정 기준">{[['PREFERENCE','상환 성향으로'],['TARGET_DATE','완납일 기준'],['EXTRA_AMOUNT','추가 상환액 기준']].map(([id,label])=><button key={id} disabled={pending} className={mode===id?'selected':''} aria-pressed={mode===id} onClick={()=>setMode(id)}>{label}</button>)}</div>
    <div className="plan-edit-grid" data-mode={mode}><section className="lm-card plan-input"><h2>{mode==='TARGET_DATE'?'희망 완납일':mode==='EXTRA_AMOUNT'?'월 추가 상환액':'상환 성향'}</h2>
      {mode==='TARGET_DATE'?<><label>희망 완납일</label><div className={'field-row '+(invalid?'has-error':'')}><select aria-label="희망 완납 연도" disabled={pending} value={year} onChange={e=>setYear(Number(e.target.value))}>{Array.from({length:yearEnd-yearStart+1},(_,i)=>yearStart+i).map(y=><option value={y} key={y}>{y}년</option>)}</select><select aria-label="희망 완납 월" disabled={pending} value={month} onChange={e=>setMonth(Number(e.target.value))}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}월</option>)}</select></div><p className={invalid?'field-error':'field-helper'}>{maturity?(invalid?'계약 만기 '+maturity.slice(0,7).replace('-','.')+'보다 뒤로 정할 수 없어요':'계약 만기 '+maturity.slice(0,7).replace('-','.')+'까지 정할 수 있어요'):''}</p><div className="edit-preview"><div><p>월 상환액</p><strong>{won(preview?.monthly_burden)}</strong></div><div><p>월 추가 상환</p><strong>{won(sum(proposed,'extra_monthly_payment'))}</strong></div><div><p>예상 완납일</p><strong>{monthLabel(preview?.estimated_payoff_date)}</strong></div></div></>:mode==='EXTRA_AMOUNT'?<><div className="v2-extra-stepper"><AmountField name="plan-extra" label="변경할 월 추가 상환액" value={extra} disabled={pending} onChange={setExtra}/><button aria-label="추가 상환액 줄이기" disabled={pending} onClick={()=>setExtra(Math.max(0,Number(extra)-10000))}><img src={v2Icons.minus} alt=""/></button><button aria-label="추가 상환액 늘리기" disabled={pending} onClick={()=>setExtra(Number(extra)+10000)}><img src={v2Icons.plus} alt=""/></button></div><button className="lm-button outline small" disabled={pending} onClick={()=>setExtra(0)}>기본 상환만</button></>:<div className="personality-options">{[['FAST','빠른 상환','매달 더 갚아서 이자를 줄여요',icons.fast],['BALANCED','균형 상환','상환과 생활비를 적당히 나눠요',icons.target],['STABLE','생활 안정 우선','기본 상환을 유지하며 여유를 지켜요',icons.stable]].map(([id,label,description,icon])=><button key={id} disabled={pending} className={preference===id?'selected':''} onClick={()=>setPreference(id)}><span><img src={icon} alt=""/></span><div><strong>{label}</strong><p>{description}</p></div></button>)}</div>}
      {warning&&!invalid&&<div className="v2-plan-warning" role="status"><strong><img src={v2Icons.warning} alt=""/>{typeof warning==='string'?warning:'여유자금보다 '+won(warning.amount)+' 많아요'}</strong><p>{typeof warning==='string'?'현재 재정 상태를 확인해 주세요. 그래도 이 목표로 저장할 수 있어요':warning.message}</p></div>}
    </section><section className="lm-card plan-comparison"><h2>현재 계획과 비교</h2>{!invalid&&<ApiState status={resource.status} error={resource.error} onRetry={resource.reload}/>}
      <table className="lm-table"><thead><tr><th>항목</th><th>현재</th><th>변경 후</th></tr></thead><tbody>
        <tr><th>월 상환액</th><td className="comparison-current">{won(sum(current,'monthly_amount'))}<small>원금 — + 이자 —</small></td><td><strong>{won(preview?.monthly_burden)}</strong>{preview&&<><small>원금 — + 이자 —</small><small>{preview.delta.monthly_burden_delta>=0?'+':''}{won(preview.delta.monthly_burden_delta)}</small></>}</td></tr>
        <tr><th>월 추가 상환</th><td>{won(sum(current,'extra_monthly_payment'))}</td><td><strong>{won(sum(proposed,'extra_monthly_payment'))}</strong></td></tr>
        <tr><th>예상 완납일</th><td>{monthLabel(compareDate)}</td><td><strong>{monthLabel(preview?.estimated_payoff_date)}</strong>{preview&&<small>{preview.delta.payoff_months_saved}개월 앞당김</small>}</td></tr>
        <tr><th>총 이자(예상)</th><td>{won(sum(current,'estimated_total_interest'))}</td><td><strong>{won(preview?.estimated_total_interest)}</strong>{preview&&<small>−{won(preview.delta.interest_saving)}</small>}</td></tr>
      </tbody></table><p className="field-helper">현재 금리 {selected.length===1?selected[0].rate+'%':''} 기준</p>
      {error&&<p className="field-error" role="alert">{error}</p>}
      <footer><button className="lm-button outline" disabled={pending} onClick={onCancel}>취소</button><button className="lm-button primary" disabled={pending||invalid||!preview||!loanIds.length} onClick={save}>{pending?'저장 중…':warning?'이 목표로 저장하기':'이 계획으로 바꾸기'}</button></footer>
    </section></div>
  </>
}