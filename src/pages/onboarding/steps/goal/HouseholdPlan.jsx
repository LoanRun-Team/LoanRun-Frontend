import { useState } from 'react'
import PlanOptionCard from '../../components/PlanOptionCard.jsx'
import SegmentTabs from '../../components/SegmentTabs.jsx'
import SelectField from '../../components/SelectField.jsx'
import NumberField from '../../components/NumberField.jsx'
import { StatBox } from '../../components/PlanResult.jsx'
import { PREFERENCES, preferenceText } from '../../preferences.js'
import { fmtNumber, fmtWon } from '../../format.js'
import { PREFERENCE_LABEL, draftOf, fmtGap, fmtYM, isLump, loanChipLabel } from '../../planModel.js'

// Figma: S-03m-1 다중채무 · 전체 — 가구 단위로 상환 성향·완납일·추가 상환액을 정하면 대출별로 나눠 배분한다.
// 만기일시(적립) 대출은 대출별 탭에서 따로 정하므로 여기서는 일괄 적용하지 않는다.
const TABS = [{ id: 'preference', label: '상환 성향으로' }, { id: 'date', label: '완납일 기준' }, { id: 'extra', label: '추가 상환액 기준' }]
const thisYear = new Date().getFullYear()
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))
const manWon = n => `${Math.round(n / 10000).toLocaleString('ko-KR')}만원`

// 우선순위: 변동금리 대출을 잔액이 큰 순서로, 그다음 고정금리 대출을 금리가 높은 순서로.
const byPriority = (a, b) => (a.rate_type === b.rate_type
  ? (a.rate_type === 'VARIABLE' ? b.remaining_principal - a.remaining_principal : b.annual_rate - a.annual_rate)
  : (a.rate_type === 'VARIABLE' ? -1 : 1))

export default function HouseholdPlan({ form, setForm, preview, surplus }) {
  const { loans, goal } = form
  const [tab, setTab] = useState('preference')
  const targets = loans.filter(l => !isLump(l)).toSorted(byPriority)
  const first = targets[0] ? draftOf(goal, targets[0].loan_id) : null
  const sameAll = key => targets.length > 0 && targets.every(l => draftOf(goal, l.loan_id)[key] === first[key])
  const pref = sameAll('preference') && targets.every(l => { const d = draftOf(goal, l.loan_id); return d.tab === 'preference' && d.extra_override == null }) ? first.preference : null

  const patchAll = (patchOf) => setForm(f => ({
    ...f,
    goal: { ...f.goal, plans: { ...f.goal.plans, ...Object.fromEntries(f.loans.filter(l => !isLump(l)).toSorted(byPriority).map((l, i, arr) => [l.loan_id, { ...draftOf(f.goal, l.loan_id), direction: 'early', ...patchOf(l, i, arr) }])) } },
  }))
  // 합계 금액을 우선순위 대로 대출 잔액 한도까지 채워 나눈다.
  function split(total) {
    let left = total
    return Object.fromEntries(targets.map(l => { const v = Math.min(left, l.remaining_principal); left -= v; return [l.loan_id, v] }))
  }
  const applyPreference = preference => patchAll(() => ({ tab: 'preference', preference, extra_override: null, monthly_override: null }))
  const applyAmount = (total, asTab) => { const parts = split(total ?? 0); patchAll(l => (asTab === 'extra' ? { tab: 'extra', extra_monthly_payment: parts[l.loan_id] } : { tab: 'preference', extra_override: parts[l.loan_id] })) }

  const data = preview.data
  const rows = targets.map((l, i) => ({ loan: l, priority: data?.proposed_allocations?.find(a => a.loan_id === l.loan_id)?.priority ?? i + 1, amount: data?.proposed_allocations?.find(a => a.loan_id === l.loan_id)?.amount ?? 0 }))
  const extraTotal = targets.reduce((s, l) => s + (preview.byLoan[l.loan_id]?.extra_monthly_payment ?? 0), 0)
  const direct = targets.some(l => draftOf(goal, l.loan_id).extra_override != null)
  const emergency = first?.emergency_fund ?? null
  const saved = data?.delta?.payoff_months_saved
  const years = Array.from({ length: 31 }, (_, i) => ({ value: thisYear + i, label: String(thisYear + i) }))

  const left = {
    preference: <>
      <h2>상환 성향</h2>
      <div className="ob-plan-options" role="radiogroup" aria-label="가구 상환 성향">
        {PREFERENCES.map(p => <PlanOptionCard key={p.value} name="household-pref" icon={p.icon} title={p.title} description={preferenceText(p, surplus)}
          selected={pref === p.value} onSelect={() => applyPreference(p.value)} />)}
      </div>
      {rows.length > 0 && <div className="ob-alloc" aria-label="대출별 배분">
        <h3>대출별로 나눠 갚아요</h3>
        <p className="ob-alloc-sub">전략 '금리 위험 대비' 기준 · 1순위 대출부터 채워요</p>
        <ol>
          {rows.map(r => <li key={r.loan.loan_id}><span className="ob-alloc-name">{loanChipLabel(r.loan)} · {r.priority}순위</span><strong>월 {fmtWon(r.amount)}</strong></li>)}
        </ol>
        <p className="ob-alloc-total"><span>합계{pref && !direct ? ` (${PREFERENCE_LABEL[pref].replace('있는 ', '')} 금액)` : ''}</span><strong>월 {fmtWon(rows.reduce((s, r) => s + r.amount, 0))}</strong></p>
      </div>}
    </>,
    date: <>
      <h2>희망 완납일</h2>
      <div className="ob-row">
        <SelectField label="희망 완납 연도" hideLabel options={years} value={first?.target_year ?? null} onChange={v => patchAll(() => ({ tab: 'date', target_year: v }))} />
        <SelectField label="희망 완납 월" hideLabel options={MONTHS} value={first?.target_month ?? null} onChange={v => patchAll(() => ({ tab: 'date', target_month: v }))} />
      </div>
      <p className="ob-helper">모든 분할상환 대출에 같은 완납일을 적용해요. 만기보다 앞선 날짜를 골라요</p>
    </>,
    extra: <>
      <h2>월 추가 상환액</h2>
      <NumberField label="월 추가 상환액" hideLabel value={targets.reduce((s, l) => s + (draftOf(goal, l.loan_id).extra_monthly_payment ?? 0), 0) || null} unit="원" placeholder="0" onChange={v => applyAmount(v, 'extra')} />
      <p className="ob-helper">{surplus ? `월 여유자금 ${fmtWon(surplus)} 안에서 ` : ''}우선순위 대출부터 채워서 나눠요</p>
    </>,
  }[tab]

  return <>
    <p className="ob-household-line"><span className="ob-chip-static">대출 {loans.length}개</span>{surplus ? `월 여유자금 ${fmtWon(surplus)} 기준 · ` : ''}성향 금액을 대출별로 나눠요</p>
    <SegmentTabs tabs={TABS} value={tab} onChange={setTab} />
    <div className="ob-plan-cards">
      <section className="ob-plan-card">{left}</section>
      <section className="ob-plan-card" aria-live="polite">
        <h2>계산 결과</h2>
        {!data ? <p className="ob-stat-pending">{preview.pending ? '계산 중…' : '방식을 고르면 전체 결과가 계산돼요'}</p> : <>
          <StatBox stats={[
            { label: '전체 예상 완납일', value: fmtYM(data.estimated_payoff_date), sub: saved > 0 ? `만기보다 ${fmtGap(saved)} 빨라요` : '만기에 맞춰 완납해요' },
            { label: '월 상환액', value: fmtWon(data.monthly_burden), sub: `추가 ${fmtNumber(extraTotal)}원 포함`, accent: false },
            { label: '총 이자(예상)', value: `약 ${manWon(data.estimated_total_interest)}`, sub: data.delta?.interest_saving > 0 ? `${manWon(data.delta.interest_saving)} 덜 내요` : '', accent: false },
          ]} />
          <NumberField label="목표 비상자금 (선택)" value={emergency} unit="원" placeholder="예: 6,000,000" onChange={v => patchAll(() => ({ emergency_fund: v }))} />
          {tab === 'preference' && <>
            <NumberField label="월 추가 상환 희망액 (선택)" value={extraTotal} unit="원" placeholder="0" onChange={v => applyAmount(v, 'preference')} helper="금액을 바꾸면 성향이 '직접 설정'으로 바뀌어요" />
            {pref && !direct && <span className="ob-tag">성향 기본값 · {PREFERENCE_LABEL[pref]}</span>}
          </>}
        </>}
      </section>
    </div>
  </>
}
