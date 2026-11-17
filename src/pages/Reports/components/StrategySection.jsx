import radioOn from '../../../assets/reports/radio-on.svg'
import { won } from '../../Budget/budgetModel.js'
import { allocationLine, savingOf, situationCells, ymDot } from '../reportModel.js'

// Figma F4: 상환 전략 — 지금 내 상황 3칸, 전략 선택(설명 카드 + 후보 카드). 후보를 고르기 전에는 아무 카드도 선택하지 않는다(F4-0).
function Situation({ situation }) {
  return <div className="rp-sub">
    <h3>지금 내 상황</h3>
    <div className="rp-situation">
      {situationCells(situation).map(cell => <div key={cell.key} className="rp-situation-cell">
        <p className="rp-situation-title">{cell.title}</p>
        <p className="rp-situation-main">{cell.lead && <span>{cell.lead} </span>}{cell.big && <b>{cell.big}</b>}{cell.tail && <span> {cell.tail}</span>}</p>
        {cell.sub && <p className="rp-situation-sub">{cell.sub}</p>}
      </div>)}
    </div>
  </div>
}

function Candidate({ candidate, loans, recommended, selected, current, onSelect }) {
  const saving = savingOf(candidate)
  return <button type="button" role="radio" aria-checked={selected} className={`rp-candidate${selected ? ' selected' : ''}`} onClick={() => onSelect(candidate.strategy_code)}>
    <span className="rp-candidate-badges">
      {recommended && <span className="rp-chip recommend small">추천</span>}
      {current && <span className="rp-chip neutral small">적용 중</span>}
    </span>
    <span className="rp-candidate-head"><b>{candidate.label}</b><span>{candidate.reason}</span></span>
    <span className="rp-candidate-basis"><b>배분</b><span>{allocationLine(candidate, loans)}</span></span>
    <hr />
    <span className="rp-candidate-metrics">
      <span><small>완납 예상일</small><b>{ymDot(candidate.projected_payoff_date)}</b></span>
      <span><small>실질 절감</small><b>{saving.value}</b><small>{saving.note}</small></span>
    </span>
    <hr />
    <span className="rp-candidate-pros">
      <span><b className="pro">장점</b><span>{candidate.advantages[0]}</span></span>
      <span><b>단점</b><span>{candidate.disadvantages[0]}</span></span>
    </span>
    {selected && <img className="rp-radio" src={radioOn} alt="" width="20" height="20" />}
    {!selected && <i className="rp-radio off" aria-hidden="true" />}
  </button>
}

// 후보를 계산할 수 없을 때(F4-v): 만기 상환자금이 부족해 추천을 보류한다.
function Unrecommended({ situation, onPlan, onBudget }) {
  return <div className="rp-card rp-unrec">
    <h3>지금은 추가 상환 전략을 추천하기 어려워요</h3>
    <p>만기 상환자금 부족 · 이번 달 적립 목표 {won(situation.required_monthly_saving)}이 여유자금 {won(situation.recurring_capacity)}보다 커요</p>
    <div className="rp-actions">
      <button type="button" className="rp-button primary-s" onClick={onPlan}>추가 상환 목표 줄이기</button>
      <button type="button" className="rp-button soft" onClick={onBudget}>재정 상태 확인하기</button>
    </div>
  </div>
}

export default function StrategySection({ strategy, loans, selected, onSelect, onReload, onRefresh, navigate }) {
  if (strategy.status === 'loading') return <p className="rp-loading" role="status">상환 전략을 계산하는 중…</p>
  if (strategy.status === 'error') return <p className="rp-banner danger" role="alert"><span>{strategy.error?.message || '상환 전략을 불러오지 못했어요.'}</span><button type="button" className="rp-button outline small" onClick={onReload}>다시 시도</button></p>
  const data = strategy.data
  if (!data || data.strategy_type === 'NONE' || data.unavailable_reason === 'NO_LOANS' || data.unavailable_reason === 'NO_ELIGIBLE_LOANS') return null
  const picked = data.candidates.find(c => c.strategy_code === selected)
  const current = data.current_strategy.strategy_code
  return <section className="rp-strategy" id="strategy" aria-labelledby="rp-strategy-title">
    <h2 id="rp-strategy-title" className="rp-section-title">상환 전략</h2>
    {data.unavailable_reason === 'STALE' || data.unavailable_reason === 'REPORT_NOT_READY'
      ? <p className="rp-banner" role="status"><span>데이터가 바뀌어 전략을 다시 계산해야 해요.</span><button type="button" className="rp-button outline small" onClick={onRefresh}>다시 계산</button></p>
      : <>
        <Situation situation={data.situation} />
        {data.candidates.length === 0
          ? <Unrecommended situation={data.situation} onPlan={() => navigate('/loans/plan')} onBudget={() => navigate('/budget')} />
          : <div className="rp-sub">
            <h3>전략 선택</h3>
            {picked && <div className="rp-explain">
              <b>{picked.strategy_code === data.recommendation?.strategy_code ? '이 전략을 추천해요' : `${picked.label} 전략을 골랐어요`}</b>
              <span>{picked.strategy_code === data.recommendation?.strategy_code ? data.recommendation.reason : picked.reason}</span>
            </div>}
            <div className="rp-candidates" role="radiogroup" aria-label="상환 전략">
              {data.candidates.map(c => <Candidate key={c.strategy_code} candidate={c} loans={loans} recommended={c.strategy_code === data.recommendation?.strategy_code}
                selected={c.strategy_code === selected} current={c.strategy_code === current} onSelect={onSelect} />)}
            </div>
          </div>}
      </>}
  </section>
}
