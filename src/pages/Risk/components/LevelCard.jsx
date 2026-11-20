import StatusChip from './StatusChip.jsx'
import { LEVELS, levelClass, levelLabel, pct, reasonText } from '../riskModel.js'
import { won } from '../../Budget/budgetModel.js'

// 점검 행 이름은 디자인 기준(선택 지출 한도 사용률, 변동금리 위험)으로 보여 준다. 변동금리 대출이 없으면 값은 '없음'.
const CHECK_LABEL = { DISCRETIONARY_LIMIT: '선택 지출 한도 사용률', VARIABLE_EXPOSURE: '변동금리 위험' }

// 재정 위험도. 등급, 3단계 게이지, 설명 문구, 점검 4행, 상환 전략 링크를 보여 준다.
export default function LevelCard({ data, loans = [], onStrategy }) {
  const level = data.level
  // 변동금리 위험은 변동금리 대출에만 +1%p 를 적용한 월 이자 증가분을 함께 보여 준다.
  const rise = Math.round(loans.filter(l => l.rate_type === 'VARIABLE').reduce((s, l) => s + (l.remaining_principal ?? 0), 0) / 1200)
  return <section className="rk-card" aria-labelledby="rk-level-title">
    <div className="rk-grade">
      <h2 id="rk-level-title" className="rk-title">재정 위험도</h2>
      <p className={`rk-level ${levelClass(level)}`}>{levelLabel(level)}</p>
      <ol className="rk-gauge" aria-label="재정 위험도 3단계">
        {LEVELS.map(step => <li key={step.code} className={step.code === level ? `on ${levelClass(level)}` : ''} aria-current={step.code === level ? 'step' : undefined}>
          <i aria-hidden="true" /><span>{step.label}</span>
        </li>)}
      </ol>
      <p className="rk-reason">{reasonText(data)}</p>
      <ul className="rk-checks">
        {data.checks.map(check => <li key={check.code}><span>{CHECK_LABEL[check.code] ?? check.label}</span><strong>{check.code === 'VARIABLE_EXPOSURE' && !check.ratio_pct ? '없음' : pct(check.ratio_pct)}</strong><StatusChip level={check.level} />{check.code === 'VARIABLE_EXPOSURE' && rise > 0 && <small>잔액 비중 · 금리 +1%p면 월 +{won(rise)}</small>}</li>)}
      </ul>
    </div>
    {data.strategy_link_available && <button type="button" className="rk-link" onClick={onStrategy}>내게 맞는 상환 전략 보러가기 →</button>}
  </section>
}
