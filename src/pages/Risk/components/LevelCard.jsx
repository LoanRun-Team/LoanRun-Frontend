import StatusChip from './StatusChip.jsx'
import { LEVELS, levelLabel, pct, reasonText } from '../riskModel.js'

// Figma: Card / 재정 위험도 — 등급, 3단계 게이지, 설명 문구, 점검 4행, 상환 전략 링크.
export default function LevelCard({ data, onStrategy }) {
  const level = data.level
  return <section className="rk-card" aria-labelledby="rk-level-title">
    <div className="rk-grade">
      <h2 id="rk-level-title" className="rk-title">재정 위험도</h2>
      <p className={`rk-level ${level.toLowerCase()}`}>{levelLabel(level)}</p>
      <ol className="rk-gauge" aria-label="재정 위험도 3단계">
        {LEVELS.map(step => <li key={step.code} className={step.code === level ? `on ${level.toLowerCase()}` : ''} aria-current={step.code === level ? 'step' : undefined}>
          <i aria-hidden="true" /><span>{step.label}</span>
        </li>)}
      </ol>
      <p className="rk-reason">{reasonText(data)}</p>
      <ul className="rk-checks">
        {data.checks.map(check => <li key={check.code}><span>{check.label}</span><strong>{pct(check.ratio_pct)}</strong><StatusChip level={check.level} /></li>)}
      </ul>
    </div>
    {data.strategy_link_available && <button type="button" className="rk-link" onClick={onStrategy}>내게 맞는 상환 전략 보러가기 →</button>}
  </section>
}
