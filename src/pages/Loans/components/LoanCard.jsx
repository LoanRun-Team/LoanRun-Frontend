import ProgressRing from '../../../components/Charts/ProgressRing.jsx'
import { clampPercent } from '../../../components/Charts/chartGeometry.js'
import { money } from '../data.js'
import { v2Icons } from '../v2Icons.js'
export default function LoanCard({loan,onHistory,onPlan,onRate,onDelete}) {
  const paid=loan.stage==='paid'||loan.balance===0,percent=clampPercent(loan.percent)
  return <article className={'lm-card owned-loan '+(paid?'is-complete':'')}>
    <header><h2>{loan.name}</h2><span className={'lm-chip '+(paid?'complete-chip':'')}>{paid?'완납':loan.variable?'변동금리':'고정금리'}</span></header>
    <p className="product-name">{loan.product}</p>
    <div className="balance-row"><div><p className="lm-caption">남은 원금</p><strong className="lm-number">{money(loan.balance)}<small>원</small></strong></div><div className="principal-ring" role="img" aria-label={'갚은 원금 '+percent+'%'}><ProgressRing percent={percent}/><div><span>갚은 원금</span><strong>{percent}%</strong></div></div></div>
    <dl className="loan-facts">
      <div><dt>앞으로 낼 이자(현재 금리 기준)</dt><dd>{paid?'0원':loan.interest}</dd></div>
      <div><dt>{paid?'이번 달 납부':'이번 달 납부 구성'}</dt><dd>{paid?'없음 · 완납':<>원금 {money(loan.principalPayment)} + 이자 {money(loan.interestPayment)}{loan.dto.plan?.extra_monthly_payment>0&&<small>추가 상환 {money(loan.dto.plan.extra_monthly_payment)}원 별도</small>}</>}</dd></div>
      <div><dt>금리</dt><dd>{loan.variable?<button className="rate-history-button" onClick={onRate}><span>변동 {loan.rate}%{loan.dto.next_rate_reset_date&&<small>다음 재설정 {loan.dto.next_rate_reset_date}</small>}</span><img src={v2Icons.rateChevron} alt=""/></button>:'고정 '+loan.rate+'%'}</dd></div>
      <div><dt>{paid?'완납일':'다음 상환일 / 목표 완납'}</dt><dd>{paid?loan.finish:(loan.nextDate||'—')+' / '+loan.finish}</dd></div>
    </dl>
    <footer><button className="lm-button subtle small" onClick={onHistory}>{paid?'상환 기록 보기':'상환 내역'}</button><button className="lm-button subtle small" onClick={onPlan}>{paid?'완주 화면 보기':'상환 계획'}</button><button className="lm-text loan-delete-link" onClick={onDelete}>론런에서 삭제</button></footer>
  </article>
}