import PieChart from './PieChart.jsx'
import { incomeTotal, monthName, pieSlices, won } from '../budgetModel.js'

// Figma: N월 소득 흐름 — 금액을 입력하면 원그래프, 입력 전에는 입력 안내.
// 지난달(readOnly)은 slices·incomeText 를 직접 받아 보여주고 금액 입력 버튼을 숨긴다.
export default function IncomeFlowCard({ ym, month, repayment, readOnly = false, slices, incomeText, onEnter }) {
  const title = `${monthName(ym)} 소득 흐름`
  const big = readOnly ? ' large' : ''
  if (!readOnly && !month?.entered) {
    return <section className="bd-card" aria-labelledby="bd-flow-title">
      <h3 id="bd-flow-title">{title}</h3>
      <div className="bd-empty">
        <p>이번 달 금액을 입력해 주세요</p>
        <button type="button" className="bd-button outline" onClick={onEnter}>금액 입력</button>
      </div>
    </section>
  }
  const regular = month?.income_type === 'REGULAR'
  const text = incomeText ?? `${regular && month.extras.length === 0 ? '실수령' : '소득'} ${won(incomeTotal(month))}`
  return <section className="bd-card" aria-labelledby="bd-flow-title">
    <h3 id="bd-flow-title" className={big.trim()}>{title}</h3>
    <p className="bd-flow-income">{text}</p>
    <PieChart slices={slices ?? pieSlices(month, repayment)} label={`${title}: ${text}`} />
    {!readOnly && <button type="button" className="bd-button outline fit" onClick={onEnter}>금액 입력</button>}
  </section>
}
