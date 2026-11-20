import PieChart from './PieChart.jsx'
import { incomeTotal, monthName, pieSlices, won } from '../budgetModel.js'

// N월 소득 흐름. 금액을 입력하면 원그래프를, 입력 전에는 안내를 보여준다.
// 지난달(readOnly)은 slices 를 직접 받아 보여주고 금액 입력 버튼을 숨긴다.
export default function IncomeFlowCard({ ym, month, repayment, readOnly = false, slices, onEnter }) {
  const title = `${monthName(ym)} 소득 흐름`
  if (!month.entered) {
    return <section className="bd-card" aria-labelledby="bd-flow-title">
      <h3 id="bd-flow-title" className={readOnly ? 'large' : ''}>{title}</h3>
      <div className="bd-empty">
        <p>{readOnly ? '기록이 없는 달이에요' : '이번 달 금액을 입력해 주세요'}</p>
        {!readOnly && <button type="button" className="bd-button outline" onClick={onEnter}>금액 입력</button>}
      </div>
    </section>
  }
  const regular = month.income_type === 'REGULAR'
  const text = `${regular && month.extras.length === 0 ? '실수령' : '소득'} ${won(incomeTotal(month))}`
  return <section className="bd-card" aria-labelledby="bd-flow-title">
    <h3 id="bd-flow-title" className={readOnly ? 'large' : ''}>{title}</h3>
    <p className="bd-flow-income">{text}</p>
    <PieChart slices={slices ?? pieSlices(month, repayment)} label={`${title}: ${text}`} />
    {!readOnly && <button type="button" className="bd-button outline fit" onClick={onEnter}>금액 입력</button>}
  </section>
}
