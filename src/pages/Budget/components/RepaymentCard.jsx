import { fmt } from '../budgetModel.js'

// Figma: 이번 달 상환 — 이번 달 상환 예정액(기본 + 추가)과 현재 상환액
export function Stat({ label, value, unit = '원', small = false }) {
  return <div className={`bd-stat${small ? ' small' : ''}`}>
    <span>{label}</span>
    <strong>{fmt(value)}<small>{unit}</small></strong>
  </div>
}

export default function RepaymentCard({ title = '이번 달 상환', plannedLabel = '이번 달 상환 예정액', paidLabel = '현재 상환액', planned, paid }) {
  return <section className="bd-card" aria-labelledby="bd-repay-title">
    <h2 id="bd-repay-title">{title}</h2>
    <div className="bd-stats">
      <Stat label={plannedLabel} value={planned} />
      <Stat label={paidLabel} value={paid} />
    </div>
  </section>
}

