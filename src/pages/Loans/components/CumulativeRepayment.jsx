import { money } from '../data.js'
import StackedBarChart from '../../../components/Charts/StackedBarChart.jsx'
import { v2Icons } from '../v2Icons.js'
export default function CumulativeRepayment({data,message}) {
  const rows=(data.periods||[]).map((label,i)=>({label,principal:data.principalRows?.[i]??0,interest:data.interestRows?.[i]??0,actual:data.actual?.[i]??0,plan:data.planned?.[i]??0}))
  const diff=data.paymentDifference
  const signed=diff==null?'—':diff===0?'±0':(diff<0?'−':'+')+money(Math.abs(diff))
  return <section className="lm-card cumulative-card v2-cumulative"><h2>계획 대비 누적 상환</h2><p className={diff<0?'warning':''}>{message||data.paymentMessage||(diff==null?'아직 비교할 기록이 충분하지 않아요':diff===0?'계획대로 갚고 있어요':'계획보다 '+money(Math.abs(diff))+'원 '+(diff<0?'덜 갚았어요':'더 갚았어요'))}</p>
    <div className="cumulative-summary">{[['누적 납부',data.total],['그중 원금',data.principal],['그중 이자',data.interest]].map(([label,value],i)=><div key={label}><p>{i>0&&<i className={i===2?'interest':''}/>} {label}</p><div className="cumulative-value"><strong>{money(value)}<small>원</small></strong>{i===0&&<span className={'plan-difference-chip '+(diff<0?'behind':diff>0?'ahead':'on-plan')}>계획 대비 {signed}{diff==null?'':'원'}</span>}</div></div>)}</div>
    <div className="chart-legend"><span><i/>원금</span><span><i className="interest"/>이자</span><span><img src={v2Icons.planLegend} alt=""/>계획(누적)</span></div>
    {rows.length?<><StackedBarChart rows={rows} cumulative maxValue={data.max} event={data.rateChange} label="월별 계획 대비 누적 상환 그래프"/><div className="lm-table-scroll"><table className="lm-table plan-table"><tbody>{[['계획',data.planned],['실제',data.actual],['원금',data.principalRows],['이자',data.interestRows],['차이',rows.map(r=>r.actual-r.plan)]].map(([label,values])=><tr key={label} className={label==='실제'?'actual-payment-row':''}><th>{label}</th>{rows.map((r,i)=><td key={r.label} className={label==='차이'?(values[i]<0?'warning':'teal'):''}>{label==='차이'?(values[i]===0?'±0':(values[i]<0?'−':'+')+money(Math.abs(values[i]))):money(values?.[i])}원</td>)}</tr>)}</tbody></table></div></>:<p className="v2-empty">납부를 기록하면 월별 그래프가 표시돼요.</p>}
  </section>
}