import { useState } from 'react'
import { services,isMock } from '../../../api/runtime.js'
import { useApiResource } from '../../../api/useApiResource.js'
import { errorMessage } from '../../../api/ApiError.js'
import { won,monthLabel,seoulToday } from '../../../api/format.js'
import ApiState from '../../../components/ApiState/ApiState.jsx'
import AllocationDialog from './AllocationDialog.jsx'
import { allocationRows,allocationTotals,strategyNames } from '../allocationModel.js'
import { overallPreview } from '../../../api/mock/overallDesignPreview.js'
import chevron from '../../../assets/loans/overall-plan-chevron.svg'

function Roadmap({rows}) {
  const start=Number(seoulToday().slice(0,4)),ends=rows.map(r=>Number(r.payoff?.slice(0,4))).filter(Number.isFinite),end=Math.ceil((Math.max(start+5,...ends)+1)/5)*5
  const range=end-start,ticks=Array.from({length:Math.floor(range/5)},(_,i)=>Math.ceil(start/5)*5+i*5).filter(y=>y<=end)
  const width=date=>date?Math.max(0,Math.min(100,((Number(date.slice(0,4))-start+Number(date.slice(5,7))/12)/range)*100)):0
  return <section className="lm-card v3-roadmap"><h2>완납 로드맵</h2><div className="lm-table-scroll"><div className="v3-roadmap-chart"><div className="v3-roadmap-axis"><span>지금</span>{ticks.map(y=><span key={y} style={{left:width(y+'-01')+'%'}}>{y}</span>)}</div>{rows.map(r=><div className="v3-roadmap-row" key={r.loan_id}><div><strong>{r.name}</strong><small>{r.bullet?'만기일시':r.loan?.dto.repayment_method==='EQUAL_PRINCIPAL'?'원금균등':'원리금균등'}</small></div><div className="v3-roadmap-track">{ticks.map(y=><i key={y} style={{left:width(y+'-01')+'%'}}/>)}<div className={'v3-roadmap-bar '+(r.bullet?'bullet':r.loan?.dto.loan_type==='MORTGAGE'?'mortgage':'credit')} style={{width:width(r.payoff)+'%'}}>{r.bullet&&<b/>}{r.handoff_date&&<><b className="v3-handoff-dot" style={{left:Math.min(100,width(r.handoff_date)/Math.max(1,width(r.payoff))*100)+'%'}}/><em style={{left:Math.min(100,width(r.handoff_date)/Math.max(1,width(r.payoff))*100)+'%'}}>추가 상환 이월</em></>}</div><span className="v3-roadmap-end" style={{left:width(r.payoff)+'%'}}>{r.payoff?r.payoff.slice(0,7).split('-').map(Number).join('.')+(r.bullet?' 만기 · 원금 한 번에 상환':' 완납 예상'):'예상일 확인 전'}</span></div></div>)}</div></div></section>
}
export default function OverallPlan({loans,navigate,scenario,previewData}) {
  const [dialog,setDialog]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState(''),[previewOverride,setPreviewOverride]=useState(null)
  const month=seoulToday().slice(0,7),preview=previewData||(isMock?overallPreview(scenario):null)
  const resource=useApiResource('overall:'+scenario,async signal=>{
    if(preview)return preview
    const profile=await services.profile(signal)
    if(profile.plan_type==='FREE')return {overall:{state:'LOCKED'},budget:null,loans}
    const [overall,budget]=await Promise.all([services.overallPlan(signal),services.budgetMonth(month,signal)])
    return {overall,budget,loans}
  })
  const data=previewOverride||resource.data
  if(resource.status!=='success')return <ApiState status={resource.status} error={resource.error} onRetry={resource.reload}/>
  const overall=data.overall,budget=data.budget,locked=overall.state==='LOCKED',empty=['EMPTY','NOT_APPLIED','NO_STRATEGY'].includes(overall.state),unavailable=['UNAVAILABLE','UNRECOMMENDABLE','NOT_RECOMMENDED'].includes(overall.state)
  const rows=allocationRows(overall,data.loans||loans,budget),available=budget?.available_cash??null,totals=allocationTotals(rows,available)
  const recommended=allocationRows({...overall,allocations:overall.strategy_allocations||overall.allocations},data.loans||loans,null)
  const manual=overall.strategy_code==='MANUAL',strategy=overall.strategy_code
  async function save(next,sum,adjusted){setPending(true);setError('');try{
    if(preview){setPreviewOverride({...data,overall:{...overall,strategy_code:adjusted?'MANUAL':preview.overall.recommended_strategy_code||preview.overall.strategy_code},budget:{...budget,allocation:{allocations:next.map((r,i)=>({...r,priority:i+1})),reserve_amount:sum.reserve}}})}
    else {await services.saveAllocation(month,{allocations:next.map(r=>({loan_id:r.loan_id,amount:Number(r.amount)||0,allocation_type:r.bullet?'REPAYMENT_SAVING':'EXTRA_PAYMENT'})),reserve_amount:sum.reserve},crypto.randomUUID());resource.reload()}
    setDialog(false)
  }catch(e){setError(errorMessage(e))}finally{setPending(false)}}
  if(empty)return <section className="lm-card v3-overall-empty"><h2>전체 상환 계획</h2><p>상환 리포트에서 전략을 반영하면 전체 상환 계획이 생겨요</p><button className="lm-button primary" onClick={()=>navigate('/reports')}>내게 맞는 상환 전략 보러가기</button></section>
  if(locked)return <div className="v3-overall-locked"><div className="v3-lock-preview" aria-hidden="true" inert><OverallPlan loans={[]} navigate={()=>{}} previewData={overallPreview('overall-applied')}/></div><section className="v3-lock-message"><h2>전체 상환 계획은 PRO에서 볼 수 있어요</h2><button className="lm-button primary" onClick={()=>navigate('/settings/plan')}>PRO 알아보기</button></section></div>
  const allocationCapacity=Math.max(1,available??0,totals.total)
  return <div className="v3-overall-plan">
    <section className="lm-card v3-overall-hero"><h2>전체 상환 계획</h2><div className="v3-overall-title"><div><p>적용 전략</p><strong>{unavailable?'추천 불가':strategyNames[strategy]||strategy}</strong><small>{unavailable?'만기 상환자금 부족':manual?'배분 금액을 직접 바꿨어요':overall.applied_at?.slice(0,10).replaceAll('-','.')+' 반영'}</small></div><button className="lm-button" onClick={()=>navigate('/reports')}>상환 리포트에서 전략 바꾸기 →</button></div><dl className="v3-overall-facts">{[['월 여유자금',won(available)],['이번 달 추가 상환·적립 합계',won(totals.total)],['마지막 대출 완납 예상일',monthLabel(overall.projected_payoff_date)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    <section className="lm-card v3-allocation-card"><header><h2>이번 달 여유자금 배분</h2><button className="lm-button outline small" onClick={()=>{setError('');setDialog(true)}}>배분하기</button></header>
      {unavailable?<><div className="v3-capacity-row"><span>월 여유자금</span><div><i style={{width:Math.min(100,(available||0)/Math.max(1,totals.total)*100)+'%'}}/></div><strong>{won(available)}</strong></div><p className="v3-capacity-gap">{won(Math.max(0,totals.total-(available||0)))} 부족</p><div className="v3-capacity-row"><span>이번 달 적립 목표</span><div className="bullet"><i style={{width:'100%'}}/></div><strong>{won(totals.total)}</strong></div><p>이번 달 적립 목표가 여유자금보다 많아 추가 상환 배분을 만들 수 없어요</p></>:<><div className="v3-allocation-bar">{rows.map(r=><span key={r.loan_id} className={r.bullet?'bullet':r.loan?.dto.loan_type==='MORTGAGE'?'mortgage':'credit'} style={{width:(Number(r.amount)||0)/allocationCapacity*100+'%'}}/>)}<span className="reserve" style={{flex:1}}/></div><div className="v3-allocation-legend">{[...rows,{loan_id:'reserve',name:'남는 금액',amount:totals.reserve}].map((r,i)=><div key={r.loan_id}><i className={'v3-loan-dot '+(r.loan_id==='reserve'?'reserve':r.bullet?'bullet':r.loan?.dto.loan_type==='MORTGAGE'?'mortgage':'credit')}/><span>{r.loan_id!=='reserve'?['①','②','③','④','⑤','⑥','⑦'][i]+' ':''}{r.name}{r.bullet?' 적립':''}</span><strong>{won(Number(r.amount)||0)}</strong><small>{available>0?((Number(r.amount)||0)/available*100).toLocaleString('ko-KR',{maximumFractionDigits:1}):'—'}%</small></div>)}</div></>}
    </section>
    {unavailable?<section className="lm-card v3-overall-empty"><h2>지금은 추가 상환 배분을 만들기 어려워요</h2><button className="lm-button primary" onClick={()=>navigate('/budget')}>재정 상태 확인하기</button></section>:<><section className="lm-card v3-pay-order"><h2>갚는 순서</h2><p>{manual?'내가 정한 순서와 금액으로 갚아요':strategy==='RATE_RISK'?'변동금리 대출 중 잔액이 큰 대출부터 갚아요':strategy==='INTEREST_SAVING'?'현재 적용한 이자 절약 전략에 따라 갚아요':'현재 적용한 전략 순서대로 갚아요'}</p><p>만기 상환 적립을 먼저 떼고 남은 돈을 배분해요</p><ol>{rows.map((r,i)=><li key={r.loan_id}><span className={'v3-order-number '+(Number(r.amount)>0?'active':'')}>{i+1}</span><div className="v3-order-content"><div className="v3-order-card"><header><i className={'v3-loan-dot '+(r.bullet?'bullet':r.loan?.dto.loan_type==='MORTGAGE'?'mortgage':'credit')}/><strong>{r.name}</strong><span className="lm-chip">{r.bullet?'매달 먼저 적립':Number(r.amount)===0?'대기':i===rows.findIndex(r=>!r.bullet&&Number(r.amount)>0)?'집중 상환 중':'함께 상환 중'}</span>{!r.bullet&&<span className="lm-chip">{manual?'직접 지정':(r.loan?.variable?'변동 ':'고정 ')+r.loan?.rate+'%'}</span>}{!r.bullet&&<button className="lm-icon-button" aria-label={r.name+' 상환 계획 보기'} onClick={()=>navigate('/loans/plan?loan='+r.loan_id)}><img src={chevron} alt=""/></button>}</header><dl>{[[r.bullet?'이번 달 적립':'이번 달 배분',won(Number(r.amount)||0)],[r.bullet?'남은 마련 금액':'남은 원금',won(r.bullet?Math.max(0,(r.balance||0)-(r.loan?.dto.savings_balance||0)):r.balance)],[r.bullet?'만기':'완납 예상',monthLabel(r.bullet?r.loan?.dto.maturity_date:r.payoff)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>{r.handoff_message&&<p>{r.handoff_message}</p>}</div></li>)}</ol></section><Roadmap rows={[...rows].sort((a,b)=>(a.bullet?0:a.loan?.dto.loan_type==='MORTGAGE'?1:2)-(b.bullet?0:b.loan?.dto.loan_type==='MORTGAGE'?1:2))}/></>}
    {dialog&&<AllocationDialog rows={rows} recommended={recommended} available={available} strategy={overall.recommended_strategy_code||strategy} pending={pending} error={error} onClose={()=>!pending&&setDialog(false)} onSave={save}/>}
  </div>
}
