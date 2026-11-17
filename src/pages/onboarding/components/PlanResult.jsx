import swap from '../../../assets/onboarding/icon-swap.svg'
import NumberField from './NumberField.jsx'
import { diffMonths, fmtNumber, fmtWon, todayISO } from '../format.js'
import { PREFERENCE_LABEL, fmtGap, fmtYM, isLump, planPayload } from '../planModel.js'

// Figma: Card / 계산 결과 — 값 두 개(Stat box) + 목표 비상자금(선택) + (성향 탭이면) 직접 설정 금액
export function StatBox({ stats }) {
  return <div className="ob-stat-box">
    {stats.map((s, i) => <div key={s.label}>
      <span className="ob-stat-label">{s.label}</span>
      <strong className={i === 0 && s.accent !== false ? 'accent' : ''}>{s.value}</strong>
      <span className="ob-stat-sub">{s.sub}</span>
    </div>)}
  </div>
}

export function EmptyResult() {
  return <div className="ob-empty">
    <span className="ob-empty-icon"><img src={swap} alt="" width="20" height="20" /></span>
    <p>방식을 고르면 완납일과 월 상환액이 계산돼요</p>
  </div>
}

// 탭별로 보여주는 값. res 는 상환 계획 미리보기의 proposed_plans 항목.
function statsFor(loan, draft, res) {
  const lump = isLump(loan)
  const base = loan.estimated_monthly_payment // 분할: 기본 월 상환액 / 일시·한도: 이자만 내는 월 이자
  const extra = res.extra_monthly_payment
  const saved = Math.max(0, diffMonths(res.estimated_payoff_date, loan.maturity_date))
  const monthlySub = lump ? `첫 달 이자 ${fmtNumber(base)}원 포함` : `기본 ${fmtNumber(base)} + 추가 ${fmtNumber(extra)}원`

  if (draft.direction === 'maturity') {
    return [
      { label: '완납 예정일', value: fmtYM(res.estimated_payoff_date), sub: '만기일에 맞춰 완납해요' },
      { label: '월 상환액', value: fmtWon(res.monthly_amount), sub: `기본 상환만 · 추가 상환 ${fmtNumber(extra)}원` },
    ]
  }
  if (draft.tab === 'date') {
    return [
      { label: '필요한 월 상환액', value: fmtWon(res.monthly_amount), sub: monthlySub },
      { label: '앞당기는 기간', value: fmtGap(saved), sub: `만기 ${fmtYM(loan.maturity_date)} 대비` },
    ]
  }
  if (lump && draft.tab === 'monthly') {
    return [
      { label: '예상 완납일', value: fmtYM(res.estimated_payoff_date), sub: `지금부터 ${diffMonths(todayISO(), res.estimated_payoff_date)}개월` },
      { label: '첫 달 이자', value: fmtWon(base), sub: `원금 ${fmtNumber(Math.max(0, res.monthly_amount - base))}원 상환`, accent: false },
    ]
  }
  return [
    { label: '예상 완납일', value: fmtYM(res.estimated_payoff_date), sub: saved > 0 ? `만기보다 ${fmtGap(saved)} 빨라요` : '만기일에 맞춰 완납해요' },
    { label: '월 상환액', value: fmtWon(res.monthly_amount), sub: monthlySub },
  ]
}

export default function PlanResult({ loan, draft, res, pending, onDraft, title = '계산 결과' }) {
  const ready = Boolean(planPayload(loan, draft))
  const lump = isLump(loan)
  const overrideKey = lump ? 'monthly_override' : 'extra_override'
  const override = draft[overrideKey]
  const showOverride = draft.direction !== 'maturity' && draft.tab === 'preference' && res

  return <section className="ob-plan-card" aria-live="polite">
    <h2>{title}</h2>
    {!ready ? <EmptyResult /> : !res ? <p className="ob-stat-pending">{pending ? '계산 중…' : '계산 결과를 불러오지 못했어요.'}</p> : <>
      <StatBox stats={statsFor(loan, draft, res)} />
      <NumberField label="목표 비상자금 (선택)" value={draft.emergency_fund} unit="원" placeholder="예: 6,000,000" onChange={v => onDraft({ emergency_fund: v })} />
      {showOverride && <>
        <NumberField label={lump ? '월 상환 희망액 (선택)' : '월 추가 상환 희망액 (선택)'} value={override ?? (lump ? res.monthly_amount : res.extra_monthly_payment)} unit="원" placeholder="0"
          onChange={v => onDraft({ [overrideKey]: v })} helper="금액을 바꾸면 성향이 '직접 설정'으로 바뀌어요" />
        {override == null && draft.preference && <span className="ob-tag">성향 기본값 · {PREFERENCE_LABEL[draft.preference]}</span>}
      </>}
    </>}
  </section>
}
