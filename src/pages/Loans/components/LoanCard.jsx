import ProgressRing from '../../../components/Charts/ProgressRing.jsx'
import { clampPercent } from '../../../components/Charts/chartGeometry.js'
import { money } from '../data.js'
import { icons } from '../icons.js'

export default function LoanCard({ loan, onHistory, onPlan, onRate }) {
  const percent = clampPercent(loan.percent)
  return <article className={`lm-card owned-loan ${loan.id}`}>
    <header><h2>{loan.name}</h2><span className="lm-chip">{loan.variable ? '변동금리' : '고정금리'}</span></header>
    <p className="product-name">{loan.product}</p>
    <div className="balance-row"><div><p className="lm-caption">남은 원금</p><strong className="lm-number">{money(loan.balance)}<small>원</small></strong></div>
      <div className="principal-ring" role="img" aria-label={`갚은 원금 ${percent}%`}>
        <ProgressRing percent={percent} />
        <div><span>갚은 원금</span><strong>{percent}%</strong></div>
      </div>
    </div>
    <dl className="loan-facts">
      <div><dt>앞으로 낼 이자(현재 금리 기준)</dt><dd>{loan.interest}</dd></div>
      <div><dt>이번 달 납부 구성</dt><dd>원금 {money(loan.principalPayment)} + 이자 {money(loan.interestPayment)}{loan.id === 'credit' && <small>추가 상환 100,000원 포함</small>}</dd></div>
      <div><dt>금리</dt><dd>{loan.variable ? <button className="rate-history-button" onClick={onRate}><span>변동 {loan.rate}%<small>▼0.12%p · 10월부터 적용</small></span><img src={icons.chevronRight} alt="" /></button> : `고정 ${loan.rate}%`}</dd></div>
      <div><dt>다음 상환일 / 목표 완납</dt><dd>11월 {loan.day}일 / {loan.finish}</dd></div>
    </dl>
    <footer><button className="lm-button subtle small" onClick={onHistory}>상환 내역</button><button className="lm-button subtle small" onClick={onPlan}>상환 계획</button></footer>
  </article>
}
