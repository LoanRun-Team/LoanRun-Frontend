import { monthName, shiftYM, won } from '../budgetModel.js'

// Figma: N월 여유자금 정산 — 여유자금 사용 내역(총 추가 상환·예비비·이월)
export default function SettlementCard({ ym, settlement: s }) {
  return <section className="bd-card" aria-labelledby="bd-settle-title">
    <h3 id="bd-settle-title" className="large">{monthName(ym)} 여유자금 정산</h3>
    <p className="bd-inset-note">선택 지출 한도 {won(s.limit)} · 사용 {won(s.used)} · {s.saved >= 0 ? `절약 ${won(s.saved)}` : `초과 ${won(-s.saved)}`}</p>
    <h4>여유자금 {won(s.available)} 사용 내역</h4>
    {s.carryIn > 0 && <p className="bd-inset-note">지난달에서 이월된 {won(s.carryIn)}이 포함돼 있어요</p>}
    <dl className="bd-settle-list">
      <div><dt>총 추가 상환</dt><dd>{won(s.extra)}</dd></div>
      <div><dt>예비비</dt><dd>{won(s.reserve)}</dd></div>
      <div><dt>이월</dt><dd className="brand">{won(s.carry)} (→ {monthName(shiftYM(ym, 1))})</dd></div>
    </dl>
  </section>
}
