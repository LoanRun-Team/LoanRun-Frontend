import { useState } from 'react'
import { won,monthLabel } from '../../../api/format.js'
import { clampPercent } from '../../../components/Charts/chartGeometry.js'
import { v2Icons } from '../v2Icons.js'
import { icons } from '../icons.js'
import AmountField from './AmountField.jsx'
import CumulativeSavings from './CumulativeSavings.jsx'
export default function SavingsPlan({loan,data={},navigate,onRecord,onSavings,onEdit,onDelete,onShortfall,onFee,scenario}) {
  const [mode,setMode]=useState(scenario==='bullet-gain'?'custom':scenario==='bullet-loss'?'half':'all'),[amount,setAmount]=useState(data.comparisons?.custom?.amount||'')
  const chosen=data.comparisons?.[mode],payment=mode==='custom'?Number(amount):chosen?.amount
  const limit=Math.min(data.prepared??0,loan.balance??0)
  const [lastQuote,setLastQuote]=useState(data.comparisons?.all)
  const invalid=payment<0||payment>limit
  const comparison=invalid?lastQuote:mode!=='custom'||payment===chosen?.amount?chosen:null
  function chooseMode(next){setMode(next);const quote=data.comparisons?.[next],value=next==='custom'?Number(amount):quote?.amount;if(value>=0&&value<=limit)setLastQuote(value===quote?.amount?quote:{amount:value,interestSaving:null,fee:null,net:null})}
  function enterAmount(value){setAmount(value);const quote=data.comparisons?.custom;if(Number(value)<=limit)setLastQuote(Number(value)===quote?.amount?quote:{amount:Number(value),interestSaving:null,fee:null,net:null})}
  const compactStatus=Boolean(data.forecast||data.firstSaving)
  const loss=comparison?.net!=null&&comparison.net<=0
  const percent=value=>value==null?'—':Number(value).toLocaleString('ko-KR',{maximumFractionDigits:1})
  const result=comparison?.fee==null?comparison?.interestSaving:comparison?.net
  return <>
    <div className="v2-actions savings-page-actions"><button className="lm-button outline small" onClick={()=>onRecord({type:'regular',loanId:loan.id})}>납부 기록하기</button><button className="lm-button outline small" onClick={()=>onSavings(loan)}>상환자금 적립 기록하기</button></div>
    <div className="plan-top-row"><section className="lm-card v2-goal-card"><h2>내 상환 목표</h2><div className="v2-goal-main"><div><p>상환 방식</p><strong>만기일시 · 적립</strong></div><button className="lm-button outline" onClick={()=>navigate('/loans/plan/edit?loan='+loan.id)}>계획 수정</button></div><dl className="v2-goal-facts">{[['월 필요 적립액',won(data.baseMonthlyTarget??data.monthlyTarget)],['목표 완납일',monthLabel(data.targetDate||loan.dto.maturity_date)],['매월 내는 이자',won(data.interest)+'(별도)'],['앞으로 마련할 금액',won(data.remaining)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    <section className="lm-card plan-finish"><h2>만기까지</h2><strong className="d-day">{data.monthsLeft??'—'}개월</strong><p>계약 만기 <strong>{monthLabel(data.targetDate||loan.dto.maturity_date)}</strong></p><div className="pace-status v3-savings-pace">{!data.firstSaving&&<span className={data.forecast?'warning':''}><img src={data.forecast?icons.slowDot:icons.steadyDot} alt=""/>{data.shortfall==null?'적립 현황':data.forecast?'속도 조절 필요':data.shortfall>0?'적립 부족':'순항 중'}</span>}<strong>{data.firstSaving?'첫 적립을 기록하면 만기까지 예상을 더 볼게요':data.forecast?'만기 전 상환자금 마련이 부족할 수 있어요':data.shortfall==null?'이번 달 적립 목표와 기록을 확인해 주세요':data.shortfall>0?'이번 달 적립 목표를 확인해 주세요':'만기까지 상환자금을 모두 마련할 수 있어요'}</strong></div></section></div>
    {data.forecast&&<section className="lm-card v3-savings-forecast"><header><h2>현재 적립 속도로는 만기까지 상환자금 마련이 어려워요</h2><span className="lm-chip">주의</span></header><p>{data.forecast.message}</p>{data.forecast.basis&&<small>{data.forecast.basis}</small>}</section>}
    <div className={'v2-savings-columns v3-savings-row '+(compactStatus?'compact-status':'')}><section className="lm-card v2-savings-status"><h2>상환자금 적립 현황</h2><dl className="v2-key-values">{[['현재까지 마련한 상환자금',data.prepared],['앞으로 마련할 금액',data.remaining],['이번 달 적립 목표액',data.monthlyTarget],['이번 달 실제 적립액',data.monthlyActual],['누적 적립 진행률',data.cumulativePercent]].filter((_,i)=>!compactStatus||i!==4).map(([label,value],i)=><div key={label}><dt>{label}</dt><dd>{i===4?percent(value)+'%':won(value)}</dd></div>)}</dl>
      {data.shortfall>0&&<button className="v2-shortfall-link" onClick={onShortfall}>기본 {won(data.baseMonthlyTarget??data.monthlyTarget)} + 미적립 {won(data.shortfall)} <span>미적립 금액 자세히 보기 ›</span></button>}
      <div className="v2-savings-meters">{(compactStatus?[['이번 달 달성률',data.monthlyPercent],['누적 진행률',data.cumulativePercent]]:[['원금 상환 진행률',data.principalPercent],['이번 달 적립 달성률',data.monthlyPercent]]).map(([label,value],i)=><div key={label}><p>{!compactStatus&&<img src={i?v2Icons.savingsProgressDot:v2Icons.principalProgressDot} alt=""/>}{label}<strong>{percent(value)}%</strong></p><div className="v2-meter"><span style={{width:clampPercent(value)+'%'}}/></div>{!compactStatus&&<small>{i?'목표 '+won(data.monthlyTarget)+' · 적립 '+won(data.monthlyActual):'실제 갚은 원금 기준'}</small>}</div>)}</div>
    </section>
    <section className="lm-card v2-savings-history"><h2>적립 내역</h2>{data.records?.length?data.records.map(record=><div key={record.id}><time>{record.date.replaceAll('-','.')}</time><strong>{won(record.amount)}</strong><button className="lm-text" disabled={record.editable===false} onClick={()=>onEdit(loan,record)}>수정</button><button className="lm-text" disabled={record.editable===false} onClick={()=>onDelete(record)}>삭제</button></div>):<p className="v2-empty">첫 적립 기록을 남겨 보세요.</p>}</section></div>
    <CumulativeSavings data={data}/>
    {data.compareAvailable!==false&&<section className="lm-card v2-pay-compare"><h2>지금 갚기 vs 계속 모으기</h2><div className="loan-filter" role="group" aria-label="지금 갚을 금액">{[['all','모은 금액 전부'],['half','절반'],['custom','직접 입력']].map(([key,label])=><button key={key} aria-pressed={mode===key} className={mode===key?'selected':''} onClick={()=>chooseMode(key)}>{label}</button>)}</div>
      {mode==='custom'&&<AmountField label="갚을 금액" value={amount} onChange={enterAmount} helper={'0원부터 '+won(limit)+'까지 입력할 수 있어요'} error={invalid?'모은 금액 안에서 입력해 주세요':undefined}/>}
      <div className="v2-inset compare-result"><p>갚을 금액 {won(invalid?lastQuote?.amount:payment)}</p><dl className="v2-key-values"><div><dt><img src={v2Icons.interestDot} alt=""/>이자 절약</dt><dd>{comparison?.interestSaving!=null?'+'+won(comparison.interestSaving):'—'}</dd></div><div><dt><img src={v2Icons.feeDot} alt=""/>중도상환수수료</dt><dd>{comparison?.fee==null?<span className="lm-chip">수수료 미반영</span>:'−'+won(comparison.fee)}</dd></div><div className="compare-net"><dt>{comparison?.fee==null?'이자 절약 (수수료 별도)':loss?'실제 손해':'실제 이득'}</dt><dd className={loss?'danger':'teal'}>약 {won(result==null?null:Math.abs(result))}</dd></div></dl></div>
      <p className={loss?'':'teal'}>{comparison?.interestSaving==null?'예상 비교 금액을 아직 확인할 수 없어요':comparison?.fee==null?'수수료 조건을 입력하면 정확히 비교해 드릴게요':loss?'지금은 수수료가 더 커서 계속 모으는 게 유리해요':'지금 일부 갚으면 이자를 더 아낄 수 있어요'}{comparison?.fee==null&&<button className="lm-text" onClick={onFee}>수수료 입력하기</button>}</p>
      <p className="field-helper">현재 금리 유지 기준 · 갚은 돈은 다시 꺼낼 수 없어요</p><button className="lm-button primary small" disabled={invalid||!(payment>0)} onClick={()=>onRecord({type:'extra',loanId:loan.id,amount:payment})}>이 금액으로 상환 기록하기</button>
    </section>}
  </>
}
