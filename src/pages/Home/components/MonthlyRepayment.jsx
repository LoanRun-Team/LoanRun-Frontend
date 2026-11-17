import { won } from '../../../api/format.js'
import PaymentRow from './PaymentRow.jsx'
export default function MonthlyRepayment({summary,checklist=[],onNavigate,onBudget,onRecord}) {
  return <section className="card repayment-card" aria-labelledby="repayment-title">
    <header className="card-header"><h2 id="repayment-title">이번 달 상환</h2><button className="text-button push-right" onClick={onBudget}>예산·지출 →</button></header>
    <div className="home-monthly-summary"><strong>이번 달 {summary.total_count}건 중 {summary.completed_count}건 완료</strong><p>남은 금액 <strong>{won(summary.remaining_required_amount)}</strong></p></div>
    <ul className="home-payment-checklist">{checklist.map(item=><PaymentRow key={item.due_item_id} item={item} onRecord={onRecord}/>)}</ul>
    {!checklist.length&&<p className="home-empty">예정된 납부가 없어요.</p>}
    <div className="home-payment-actions"><button className="outline-button small" disabled={!checklist.length} onClick={()=>onRecord(checklist.find(i=>i.outstanding_amount>0)||checklist[0])}>납부 기록하기</button><button className="text-button" onClick={onNavigate}>이번 달 상환 →</button></div>
  </section>
}