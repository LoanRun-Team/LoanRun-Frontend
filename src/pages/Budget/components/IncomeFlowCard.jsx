import PieChart from './PieChart.jsx'
import { incomeTotal, monthName, pieSlices, won } from '../budgetModel.js'

// Figma: N월 소득 흐름 — 금액을 입력하면 원그래프, 입력 전에는 입력 안내
export default function IncomeFlowCard({ ym, month, repayment, readOnly = false, onEnter }) {
  const title = `${monthName(ym)} 소득 흐름`
  if (!month?.entered) {
    return <section className="bd-card" aria-labelledby="bd-flow-title">
      <h3 id="bd-flow-title">{title}</h3>
      <div className="bd-empty">
        <p>이번 달 금액을 입력해 주세요</p>
        <button type="button" className="bd-button outline" onClick={onEnter}>금액 입력</button>
      </div>
    </section>
  }
  const regular = month.income_type === 'REGULAR'
  return <section className="bd-card" aria-labelledby="bd-flow-title">
    <h3 id="bd-flow-title">{title}</h3>
    <p className="bd-flow-income">{regular && month.extras.length === 0 ? '실수령' : '소득'} {won(incomeTotal(month))}</p>
    <PieChart slices={pieSlices(month, repayment)} label={`${title}: 소득 ${won(incomeTotal(month))}`} />
    {!readOnly && <button type="button" className="bd-button outline fit" onClick={onEnter}>금액 입력</button>}
  </section>
}
