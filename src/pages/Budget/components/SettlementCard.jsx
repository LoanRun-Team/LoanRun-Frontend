import { monthName, shiftYM, won } from '../budgetModel.js'

// Figma: N월 여유자금 정산 — 선택 지출 한도 대비 사용·절약, 여유자금 사용 내역(총 추가 상환·예비비·이월)
export default function SettlementCard({ ym, record }) {
  const { discretionary: d, surplusUse: u } = record
  const surplus = u.extra + u.reserve + u.carry
  return <section className="bd-card" aria-labelledby="bd-settle-title">
    <h3 id="bd-settle-title" className="large">{monthName(ym)} 여유자금 정산</h3>
    <p className="bd-inset-note">선택 지출 한도 {won(d.limit)} · 사용 {won(d.used)} · 절약 {won(d.limit - d.used)}</p>
    <h4>여유자금 {won(surplus)} 사용 내역</h4>
    <dl className="bd-settle-list">
      <div><dt>총 추가 상환</dt><dd>{won(u.extra)}</dd></div>
      <div><dt>예비비</dt><dd>{won(u.reserve)}</dd></div>
      <div><dt>이월</dt><dd className="brand">{won(u.carry)} (→ {monthName(shiftYM(ym, 1))})</dd></div>
    </dl>
  </section>
}
