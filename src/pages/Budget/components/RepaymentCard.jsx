import { dayLabel, fmt, loanName, monthName } from '../budgetModel.js'

// 이번 달 상환. 상환 예정액(기본 + 추가)과 현재 상환액을 보여 주고, detail 이면 상환 일정까지 펼친다.
export function Stat({ label, value, unit = '원', small = false, text }) {
  return <div className={`bd-stat${small ? ' small' : ''}`}>
    <span>{label}</span>
    <strong>{text ?? fmt(value)}{text ? '' : <small>{unit}</small>}</strong>
  </div>
}

export default function RepaymentCard({ title = '이번 달 상환', plannedLabel = '이번 달 상환 예정액', paidLabel = '현재 상환액', planned, paid, detail }) {
  if (!detail) {
    return <section className="bd-card" aria-labelledby="bd-repay-title">
      <h2 id="bd-repay-title">{title}</h2>
      <div className="bd-stats">
        <Stat label={plannedLabel} value={planned} />
        <Stat label={paidLabel} value={paid} />
      </div>
    </section>
  }
  const { ym, base, extra, applied, schedule, nextDay } = detail
  const extraLoanIds = new Set(detail.extraLoanIds)
  return <section className="bd-card" aria-labelledby="bd-repay-title">
    <h2 id="bd-repay-title" className="small">이번 달 상환 예정액</h2>
    <p className="bd-planned"><strong>{fmt(planned)}<small>원</small></strong><span>기본 {fmt(base)}원 + 추가 {fmt(extra)}원</span></p>
    <div className="bd-stats">
      <Stat small label="현재 상환액" value={paid} />
      <Stat small label="남은 상환 필요액" value={Math.max(0, planned - paid)} />
      <Stat small label="다음 납부일" text={nextDay ? `${monthName(ym)} ${nextDay}일` : '—'} />
    </div>
    <ul className="bd-schedule">
      {schedule.map(r => <li key={r.loan.loan_id}><span>{dayLabel(ym, r.day)}</span><strong>{loanName(r.loan)}{extraLoanIds.has(r.loan.loan_id) ? ' 기본' : ''}</strong><i className="bd-chip">확정</i><b>{fmt(r.amount)}원</b></li>)}
      <li><span>이번 달</span><strong>총 추가 상환</strong><i className="bd-chip brand">{applied ? '반영 완료' : '반영 전'}</i><b>{fmt(extra)}원</b></li>
    </ul>
  </section>
}
