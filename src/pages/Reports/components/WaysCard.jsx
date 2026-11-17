import { compareLabel } from '../reportModel.js'

// Figma F4: CompareBars — 세로 막대(또래 | 나). 막대 높이 = 120 × 값 ÷ 두 값 중 큰 값.
function CompareBars({ title, peer, mine, format }) {
  const max = Math.max(peer, mine) || 1
  const bar = (value, who) => <div className={`rp-bar ${who}`}>
    <div className="rp-bar-area"><div className="rp-bar-fill" style={{ height: `${Math.round((120 * value) / max)}px` }} /></div>
    <b>{format(value)}</b>
    <span>{who === 'me' ? '나' : '또래 평균'}</span>
  </div>
  return <div className="rp-bars-block">
    <p className="rp-bars-title">{title}</p>
    <div className="rp-bars">{bar(peer, 'peer')}{bar(mine, 'me')}</div>
  </div>
}

// Figma F4: Card / 갚는 방식 비교. 소득 대비 월 상환 비율과 추가 상환 횟수를 또래(가상 예시)와 비교한다. 비교가 DEMO 일 때만 보인다.
export default function WaysCard({ comparison }) {
  const ratioGap = Math.abs(comparison.monthly_debt_service_ratio_pct - comparison.peer_monthly_debt_service_ratio_pct)
  const countGap = Math.abs(comparison.extra_payment_count_6m - comparison.peer_extra_payment_count_6m)
  return <section className="rp-card" aria-labelledby="rp-ways-title">
    <h2 id="rp-ways-title">갚는 방식 비교</h2>
    <div className="rp-bars-pair">
      <CompareBars title="소득 대비 월 상환 비율" peer={comparison.peer_monthly_debt_service_ratio_pct} mine={comparison.monthly_debt_service_ratio_pct} format={v => `${Number(v.toFixed(1))}%`} />
      <CompareBars title="추가 상환 횟수(최근 6개월)" peer={comparison.peer_extra_payment_count_6m} mine={comparison.extra_payment_count_6m} format={v => `${Number(v.toFixed(1))}회`} />
    </div>
    <p className="rp-ways-line">추가 상환 횟수는 {Number(countGap.toFixed(1))}회, 소득 대비 월 상환 비율은 {Number(ratioGap.toFixed(1))}%p 차이가 나요</p>
    <p className="rp-ways-basis">비교 기준 · {compareLabel(comparison)} · 예시 데이터</p>
    <p className="rp-ways-basis">{comparison.disclaimer}</p>
  </section>
}
