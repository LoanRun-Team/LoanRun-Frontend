import PlanOptionCard from '../../components/PlanOptionCard.jsx'
import { StatBox } from '../../components/PlanResult.jsx'
import { PREFERENCES, preferenceText } from '../../preferences.js'
import { fmtNumber, fmtWon } from '../../format.js'
import { draftOf, fmtYM, isLump } from '../../planModel.js'

// Figma: S-03m-1 다중채무 · 전체 — 가구 단위 상환 성향을 고르면 월 여유자금 기준 금액을 대출별로 나눠 배분한다.
// 만기일시(적립) 대출은 대출별 탭에서 따로 정하므로 여기서는 성향을 일괄 적용하지 않는다.
export default function HouseholdPlan({ form, setForm, preview, surplus }) {
  const { loans, goal } = form
  const targets = loans.filter(l => !isLump(l))
  const current = targets.length && targets.every(l => { const d = draftOf(goal, l.loan_id); return d.tab === 'preference' && d.extra_override == null && d.monthly_override == null && d.preference === draftOf(goal, targets[0].loan_id).preference })
    ? draftOf(goal, targets[0].loan_id).preference : null

  const apply = preference => setForm(f => ({
    ...f,
    goal: { ...f.goal, plans: { ...f.goal.plans, ...Object.fromEntries(f.loans.filter(l => !isLump(l)).map(l => [l.loan_id, { ...draftOf(f.goal, l.loan_id), direction: 'early', tab: 'preference', preference, extra_override: null, monthly_override: null }])) } },
  }))

  const data = preview.data
  const alloc = (data?.proposed_allocations ?? []).filter(a => a.amount > 0).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
  const nameOf = id => { const l = loans.find(x => x.loan_id === id); return l ? `${l.product_name} · ${l.institution_name}` : id }
  const saved = data?.delta?.payoff_months_saved

  return <div className="ob-plan-cards">
    <section className="ob-plan-card">
      <h2>상환 성향</h2>
      <p className="ob-helper">대출 {loans.length}개 · {surplus ? `월 여유자금 ${fmtWon(surplus)} 기준` : '여유자금 기준'}으로 성향 금액을 대출별로 나눠요</p>
      <div className="ob-plan-options" role="radiogroup" aria-label="가구 상환 성향">
        {PREFERENCES.map(p => <PlanOptionCard key={p.value} name="household-pref" icon={p.icon} title={p.title} description={preferenceText(p, surplus)}
          selected={current === p.value} onSelect={() => apply(p.value)} />)}
      </div>
      {alloc.length > 0 && <div className="ob-alloc" aria-label="대출별 배분">
        <h3>대출별로 나눠 갚아요</h3>
        <ol>
          {alloc.map(a => <li key={a.loan_id}><span className="ob-alloc-rank">{a.priority ?? '-'}</span><span className="ob-alloc-name">{nameOf(a.loan_id)}</span><strong>{fmtWon(a.amount)}</strong></li>)}
        </ol>
        <p className="ob-alloc-total">합계 <strong>{fmtWon(alloc.reduce((s, a) => s + a.amount, 0))}</strong></p>
      </div>}
    </section>
    <section className="ob-plan-card">
      <h2>계산 결과</h2>
      {!data ? <p className="ob-stat-pending">{preview.pending ? '계산 중…' : '상환 성향을 고르면 전체 결과가 계산돼요'}</p>
        : <StatBox stats={[
          { label: '전체 예상 완납일', value: fmtYM(data.estimated_payoff_date), sub: saved > 0 ? `만기보다 ${saved}개월 빨라요` : '만기에 맞춰 완납해요' },
          { label: '월 상환액', value: fmtWon(data.monthly_burden), sub: '기본 상환 + 추가 상환 포함' },
          { label: '총 이자(예상)', value: fmtWon(data.estimated_total_interest), sub: data.delta?.interest_saving > 0 ? `${fmtNumber(data.delta.interest_saving)}원 덜 내요` : '' },
        ].filter(Boolean)} />}
    </section>
  </div>
}
