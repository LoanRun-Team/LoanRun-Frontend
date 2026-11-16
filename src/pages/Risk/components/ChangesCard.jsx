import dotIncrease from '../../../assets/risk/dot-increase.svg'
import dotDecrease from '../../../assets/risk/dot-decrease.svg'
import { burdenLine, changeOf, countsLine } from '../riskModel.js'

// Figma: Card / 위험 기록 — 지난 6개월 동안 월 부담이 바뀐 이벤트(날짜·무슨 일이 있었나·결과)와 요약.
export default function ChangesCard({ data }) {
  const changes = data.six_month_changes.map(changeOf)
  return <section className="rk-card" aria-labelledby="rk-changes-title">
    <h2 id="rk-changes-title" className="rk-title">지난 6개월 변화</h2>
    {changes.length === 0
      ? <p className="rk-empty">아직 기록된 변화가 없어요</p>
      : <>
        <div className="rk-legend">
          <span><img src={dotIncrease} alt="" width="8" height="8" />부담 늘어요</span>
          <span><img src={dotDecrease} alt="" width="8" height="8" />부담 줄어요</span>
        </div>
        <p className="rk-burden">{burdenLine(data)}</p>
        <ul className="rk-events">
          {changes.map(c => <li key={c.key} className="rk-event">
            <time>{c.date}</time>
            <p><span>무슨 일이 있었나</span><b>{c.what}</b></p>
            <p><span>결과</span><b className={c.up ? 'up' : 'down'}>{c.result}</b></p>
          </li>)}
        </ul>
        <p className="rk-counts">{countsLine(data)}</p>
      </>}
  </section>
}
