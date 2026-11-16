import { upcomingOf } from '../riskModel.js'

// Figma: Card / 다가오는 위험 — 날짜 칩(D-day · 날짜), 대출 이름, 한 줄 설명. 30일 이내(is_imminent)면 이름 옆에 점을 찍는다.
export default function UpcomingCard({ data, loans }) {
  const alerts = upcomingOf(data, loans)
  return <section className="rk-card" aria-labelledby="rk-upcoming-title">
    <h2 id="rk-upcoming-title" className="rk-title">다가오는 위험</h2>
    {alerts.length === 0
      ? <p className="rk-empty">다가오는 위험이 없어요</p>
      : <ul className="rk-alerts">
        {alerts.map(a => <li key={a.key} className="rk-alert">
          <span className="rk-date-chip">{a.chip}</span>
          <strong>{a.title}{a.imminent && <i className="rk-soon" role="img" aria-label="곧 다가와요" />}</strong>
          <p>{a.line}</p>
        </li>)}
      </ul>}
  </section>
}
