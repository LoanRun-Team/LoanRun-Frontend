import ProgressRing from '../../../components/Charts/ProgressRing.jsx'
import { clampPercent } from '../../../components/Charts/chartGeometry.js'

const demoSummary = { completed:200000, total:900000, extra:100000 }
const money = value => Number(value).toLocaleString('ko-KR')
export default function MonthlyRepayment({ onNavigate, summary = demoSummary }) {
  const percent = clampPercent(summary.total > 0 ? summary.completed / summary.total * 100 : 0)
  return <section className="card repayment-card" aria-labelledby="repayment-title">
    <header className="card-header"><h2 id="repayment-title">이번 달 상환</h2><button className="text-button push-right" onClick={() => onNavigate('예산·지출')}>예산·지출 →</button></header>
    <div className="repayment-summary">
      <div className="donut-column">
        <div className="donut" role="img" aria-label={`이번 달 상환 ${Math.round(percent)}% 완료`}><ProgressRing percent={percent} size={96} thickness={14.4}/><strong>{Math.round(percent)}%</strong></div>
        <div className="repayment-totals"><p>완료 {money(summary.completed)}원</p><p>남음 {money(Math.max(0,summary.total-summary.completed))}원</p></div>
      </div>
      <div className="extra-payment"><p>추가 상환</p><strong>{money(summary.extra)}원 기록</strong></div>
    </div>
    <div className="next-payment"><time dateTime="2026-11-25">11.25 (수)</time><div className="payment-loan"><span>주택담보대출</span><span className="neutral-chip">원리금</span></div><strong>예정 약 700,000원</strong><span className="payment-status">납부 전</span></div>
    <div className="repayment-link"><button className="text-button" onClick={() => onNavigate('이번 달 상환')}>이번 달 상환 →</button></div>
  </section>
}
