import { useEffect, useState } from 'react'
import { riskApi } from '../../../api/index.js'
import { EXPENSE_SHOCK, SCENARIO_TABS, emergencyRunway, limitGroups, lumpNeeds, scenarioStats } from '../scenarioModel.js'
import { won } from '../../Budget/budgetModel.js'

// Figma: E1 / E1-j / H11 — 위험 시나리오(4탭) · 어디까지 버틸 수 있나요 · 비상자금으로 버티는 기간 · 한 번에 필요한 돈
export default function ScenarioCards({ data, budget, loans }) {
  const [tab, setTab] = useState('CURRENT')
  const [sims, setSims] = useState({})
  const [failed, setFailed] = useState(false)
  const current = SCENARIO_TABS.find(t => t.key === tab)

  // 금리·소득 탭의 값은 시뮬레이션 API 로 받는다. 소득 −5% 는 비상자금 기간 계산에도 쓰므로 미리 받아 둔다.
  useEffect(() => {
    const controller = new AbortController()
    SCENARIO_TABS.filter(t => t.body).forEach(t => {
      riskApi.simulate(t.body, { signal: controller.signal }).then(
        sim => setSims(s => ({ ...s, [t.key]: sim })),
        () => { if (!controller.signal.aborted) setFailed(true) },
      )
    })
    return () => controller.abort()
  }, [data])

  const sim = sims[tab]
  const stats = !current.body || sim ? scenarioStats(tab, data, budget, sim ?? null) : null
  const runway = emergencyRunway(budget, sims.INCOME_DOWN)
  const lump = lumpNeeds(data, budget, loans)

  return <>
    <section className="rk-card" aria-labelledby="rk-scenario-title">
      <h2 id="rk-scenario-title" className="rk-title">위험 시나리오</h2>
      <div className="rk-tabs" role="tablist" aria-label="시나리오">
        {SCENARIO_TABS.map(t => <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'selected' : ''} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>
      {stats ? <dl className="rk-stats">
        {stats.map(s => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd><span>{s.sub}</span></div>)}
      </dl> : <p className="rk-empty" role="status">{failed ? '시나리오를 계산하지 못했어요.' : '계산 중…'}</p>}
      {sim?.warnings?.length > 0 && <p className="rk-note">{sim.warnings.join(' ')}</p>}
    </section>
    <div className="rk-bottom">
      <section className="rk-card" aria-labelledby="rk-limit-title">
        <h2 id="rk-limit-title" className="rk-title">어디까지 버틸 수 있나요</h2>
        {limitGroups(data, budget, loans).map(g => <div key={g.key} className="rk-limit">
          <h3>{g.title}</h3>
          {g.lines.map((l, i) => <p key={i}>{l.bold && <strong>{l.bold}</strong>}{l.text}</p>)}
        </div>)}
      </section>
      <div className="rk-side">
        <section className="rk-card" aria-labelledby="rk-runway-title">
          <h2 id="rk-runway-title" className="rk-title">비상자금으로 버티는 기간</h2>
          <p className="rk-row"><span>비상자금</span><strong>{won(runway.reserve)}</strong></p>
          <h3>매달 부족할 때</h3>
          {runway.shortfall > 0
            ? <p className="rk-row"><span>소득 −5% · 매달 {won(runway.shortfall)} 부족</span><strong>{runway.months >= 1 ? `약 ${runway.months}개월` : '1개월 미만'}</strong></p>
            : <p className="rk-row"><span>소득 −5%여도 매달 부족하지 않아요</span></p>}
        </section>
        <section className="rk-card" aria-labelledby="rk-lump-title">
          <h2 id="rk-lump-title" className="rk-title">한 번에 필요한 돈</h2>
          <div className="rk-lump"><p className="rk-row"><span>예상 못 한 지출</span><strong>{won(EXPENSE_SHOCK)}</strong></p><span className="rk-sub">{lump.shock.sub}</span></div>
          {lump.bullets.map(b => <div key={b.key} className="rk-lump"><p className="rk-row"><span>{b.title}</span><strong>{won(b.amount)}</strong></p><span className="rk-sub">{b.sub}</span></div>)}
        </section>
      </div>
    </div>
  </>
}
