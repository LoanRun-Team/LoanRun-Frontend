import { GRADES, gradeLabel, payoffHeadline, scenarioRows } from '../reportModel.js'

// Figma F4: Card / 완납 가능성. 현재 속도 기준 등급과 3단계 게이지, 시나리오 3행(현재 속도 · 금리 +1%p · 소득 −5%).
export default function PayoffCard({ report }) {
  const current = report.payoff_scenarios?.find(s => s.type === 'CURRENT')
  if (!current) return <section className="rp-card"><h2>완납 가능성</h2><p className="rp-empty">등록된 대출이 없어 계산할 수 없어요.</p></section>
  const tone = current.level.toLowerCase()
  return <section className="rp-card" aria-labelledby="rp-payoff-title">
    <h2 id="rp-payoff-title">완납 가능성</h2>
    <div className="rp-grade">
      <p className={`rp-big ${tone}`}>{gradeLabel(current.level)}</p>
      <p className="rp-grade-text">{payoffHeadline(report)}</p>
    </div>
    <div className="rp-gauge" aria-hidden="true">
      <div className="rp-gauge-bar">{GRADES.map(g => <i key={g.code} className={g.code === current.level ? `on ${tone}` : ''} />)}</div>
      <div className="rp-gauge-labels">{GRADES.map(g => <span key={g.code} className={g.code === current.level ? 'on' : ''}>{g.label}</span>)}</div>
    </div>
    <ul className="rp-scenarios">
      {scenarioRows(report).map(row => <li key={row.key}>
        <strong>{row.label}</strong>
        <span className={`rp-level ${row.level.toLowerCase()}`}>{gradeLabel(row.level)}</span>
        <span className="rp-scenario-text">{row.text}</span>
      </li>)}
    </ul>
  </section>
}
