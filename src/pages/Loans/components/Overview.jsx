import LoanCard from './LoanCard.jsx'
import { money } from '../data.js'
import { v2Icons } from '../v2Icons.js'

export default function Overview({ loans, history, navigate, onAdd, onRate, summary, totals, onDelete }) {
  const total = totals.amount
  const principal = totals.principal_amount + totals.extra_amount
  return <>
    <section className="lm-card summary-band" aria-label="대출 요약">
      <div><p>총 남은 원금</p><strong>{money(summary.total_remaining_principal)}<small>원</small></strong></div>
      <div><p>이번 달 상환 예정액</p><strong>{money(summary.total_monthly_due)}<small>원</small></strong></div>
      <div><p>현재 예상 완납</p><strong>{summary.estimated_payoff_date || '—'}</strong></div>
    </section>
    <section className="owned-loans-section"><header className="section-heading"><h2>보유 대출</h2><button className="lm-button primary" onClick={onAdd}><img src={v2Icons.add} alt="" />대출 추가</button></header>
      <div className="owned-loans-grid">{loans.map(loan => <LoanCard key={loan.id} loan={loan} onRate={() => onRate(loan)} onDelete={()=>onDelete(loan)} onHistory={() => navigate('/loans/history?loan=' + loan.id)} onPlan={() => navigate('/loans/plan?loan=' + loan.id)} />)}</div>
    </section>
    <section className="lm-card payment-overview">
      <header className="section-heading"><h2>총 납부 내역</h2><button className="lm-button subtle small" onClick={() => navigate('/loans/history')}>상환 내역 보기 →</button></header>
      <div className="payment-overview-body"><div><strong className="lm-number">{money(total)}<small>원</small></strong><div className="payment-stack"><span style={{ width: (total?principal / total * 100:0) + '%' }} /></div><div className="chart-legend"><span><i />원금 {money(principal)}원</span><span><i className="interest" />이자 {money(total - principal)}원</span></div><button className="lm-button outline small" onClick={() => navigate('/loans/history')}>상환 내역 보러 가기</button></div>
        <div className="recent-payments"><p className="lm-caption">최근 납부</p>{history.slice(0, 3).map(row => <div className="recent-payment" key={row.id}><time>{row.date}</time><span>{loans.find(loan => loan.id === row.loanId)?.name}</span><div><strong>{money(row.amount)}원</strong><p>원금 {money(row.principal)} · 이자 {money(row.interest)}</p></div></div>)}<div className="recent-more"><button className="lm-text" onClick={() => navigate('/loans/history')}>자세히 보기 →</button></div></div>
      </div>
    </section>
  </>
}
