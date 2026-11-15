import { money } from '../data.js'
import { icons } from '../icons.js'
import StackedBarChart from '../../../components/Charts/StackedBarChart.jsx'
import { clampPercent } from '../../../components/Charts/chartGeometry.js'

function principalMessage(progress) {
  if (progress.message) return progress.message
  const difference = Number(progress.principalDifference || 0)
  if (difference === 0) return '계획대로 원금을 갚고 있어요'
  const amount = Math.abs(difference)
  const label = amount >= 10000 ? `약 ${money(amount / 10000)}만 원` : `${money(amount)}원`
  return `계획보다 갚은 원금이 ${label} ${difference < 0 ? '적어요' : '더 많아요'}`
}

export default function RepaymentPlan({ loans, filter, savedPlan, navigate, data, progressByLoan = {} }) {
  const saved = savedPlan[filter]
  const credit = filter === 'credit'
  const tracks = filter === 'all' ? loans.filter(l=>!l.custom) : loans.filter(l=>l.id === filter)
  const rows = (data.periods || []).map((label,index)=>({
    label,
    principal: data.principalRows?.[index] ?? 0,
    interest: data.interestRows?.[index] ?? 0,
    actual: data.actual?.[index] ?? 0,
    plan: data.planned?.[index] ?? 0,
  }))
  const paymentDifference = Number(data.paymentDifference || 0)
  const tone = paymentDifference < 0 ? 'behind' : paymentDifference > 0 ? 'ahead' : 'on-plan'
  const signedDifference = paymentDifference === 0 ? '±0' : (paymentDifference < 0 ? '−' : '+') + money(Math.abs(paymentDifference))
  const summaryMessage = data.paymentMessage || (paymentDifference === 0 ? '계획대로 갚고 있어요' : `계획보다 ${money(Math.abs(paymentDifference))}원 ${paymentDifference < 0 ? '덜 갚았어요' : '더 갚았어요'}`)
  return <>
    <div className="plan-top-row">
      <section className="lm-card plan-goal"><h2>내 상환 목표</h2><div className="plan-personality"><div><p>상환 성향</p><strong>{saved?.personality || data.personality || '균형 상환'}</strong></div><button className="lm-button outline" onClick={()=>navigate('/loans/plan/edit?loan='+filter)}>계획 수정</button></div><dl><div><dt>완납일</dt><dd>{saved?.finish || data.finish}</dd></div><div><dt>월 상환액</dt><dd>{money(data.monthly)}원</dd></div><div><dt>기본 상환</dt><dd>{money(data.base)}원</dd></div><div><dt>추가 상환</dt><dd>{money(saved?.extra ?? data.extra)}원</dd></div></dl></section>
      <section className="lm-card plan-finish"><h2>완주까지</h2><strong className="d-day">D-{data.dday}</strong><p>예상 완납일 <strong>{data.expected}</strong></p><div className="pace-status"><span className={credit ? '' : 'warning'}><img src={credit ? icons.steadyDot : icons.slowDot} alt="" />{credit ? '순항 중' : '속도 조절 필요'}</span><strong>{data.paceMessage}</strong></div></section>
    </div>
    <section className="lm-card goal-progress"><h2>목표 달성 현황</h2>{tracks.map(loan=>{
      const progress = progressByLoan[loan.id] || {}
      const actual = clampPercent(progress.actualPercent ?? loan.percent)
      const planned = clampPercent(progress.plannedPercent)
      return <div className="goal-track-block" key={loan.id}>{filter==='all' && <strong>{loan.name}</strong>}
        <div className="goal-track"><span>출발</span><div className="goal-rail"><div style={{width:actual+'%'}} />
          <div className="runner-position" style={{left:actual+'%'}}><span>나 {actual}%</span><img src={icons.myRunner} alt="나" /></div>
          {actual !== planned && <div className="pacer-position" style={{left:planned+'%'}}><img src={icons.paceRunner} alt="페이스메이커" /></div>}
          <span className="planned-percent" style={{left:planned+'%'}}>계획 {planned}%</span>
        </div><strong><img src={icons.flag} alt="" />목표 {progress.goalDate}</strong></div>
        <p className="goal-principal-message">{principalMessage(progress)}</p>
      </div>
    })}</section>
    <section className="lm-card cumulative-card"><h2>계획 대비 누적 상환</h2><p className={paymentDifference < 0?'warning':''}>{summaryMessage}</p><div className="cumulative-summary">{[['누적 납부',data.total],['그중 원금',data.principal],['그중 이자',data.interest]].map(([label,value],i)=><div key={label}><p>{i>0 && <i className={i===2?'interest':''} />}{label}</p><div className="cumulative-value"><strong>{money(value)}<small>원</small></strong>{i===0 && <span className={`plan-difference-chip ${tone}`}>계획 대비 {signedDifference}원</span>}</div></div>)}</div>
      <div className="chart-legend"><span><i />원금</span><span><i className="interest" />이자</span><span><img src={icons.planLegend} alt="" />계획(누적)</span></div>
      <StackedBarChart rows={rows} cumulative maxValue={data.max} event={data.rateChange} label="월별 계획 대비 누적 상환 그래프" />
      <div className="lm-table-scroll"><table className="lm-table plan-table"><colgroup><col style={{width:56}}/>{rows.map((row,i)=><col key={i}/>)}</colgroup><tbody>{[['계획',data.planned],['실제',data.actual],['원금',data.principalRows],['이자',data.interestRows],['차이',rows.map(row=>row.actual-row.plan)]].map(([label,values])=><tr key={label} className={label==='실제'?'actual-payment-row':''}><th>{['원금','이자'].includes(label)&&<i className={`plan-row-swatch ${label==='이자'?'interest':''}`}/>}{label}</th>{rows.map((row,i)=>{
        const n = values?.[i] ?? 0
        return <td key={i} className={label==='차이'?(n<0?'warning':'teal'):''}>{label==='차이'?(n===0?'±0':(n>0?'+':'−')+money(Math.abs(n))):money(n)}원</td>
      })}</tr>)}</tbody></table></div>
    </section>
  </>
}
