import LoanContext from '../../components/LoanContext.jsx'
import LoanInfoCard from '../../components/LoanInfoCard.jsx'
import PlanEditor from '../../components/PlanEditor.jsx'
import { fmtWon } from '../../format.js'
import { draftOf, fmtYM, isLump, loanChipLabel, modeSummary, planPayload } from '../../planModel.js'
import { planUpdater } from './usePlanPreview.js'
import { useSavingsBalance } from './useSavingsBalance.js'

// Figma: S-03m 다중채무 — 대출마다 목표를 정한다. 위쪽 알약으로 대출을 고르고, 아래는 S-03b/S-03c 와 같은 편집기.
export default function MultiLoan({ form, setForm, preview }) {
  const { loans, goal } = form
  const active = loans.find(l => String(l.loan_id) === String(goal.activeLoanId))
  const pick = id => setForm(f => ({ ...f, goal: { ...f.goal, activeLoanId: id } }))
  const savings = useSavingsBalance(setForm)
  const pillLabel = l => `${loanChipLabel(l)} · ${l.institution_name}`

  return <>
    <div className="ob-pills" role="tablist" aria-label="대출 선택">
      <button type="button" role="tab" aria-selected={!active} className={!active ? 'selected' : ''} onClick={() => pick('all')}>전체</button>
      {loans.map(l => <button key={l.loan_id} type="button" role="tab" aria-selected={active?.loan_id === l.loan_id} className={active?.loan_id === l.loan_id ? 'selected' : ''} onClick={() => pick(l.loan_id)}>{pillLabel(l)}</button>)}
    </div>
    {active ? <>
      {isLump(active) ? <LoanInfoCard key={active.loan_id} loan={active} onSavings={v => savings.change(active, v)} busy={savings.busy} error={savings.error} /> : <LoanContext loan={active} />}
      <PlanEditor loan={active} draft={{ ...draftOf(goal, active.loan_id), direction: isLump(active) ? null : 'early' }}
        onDraft={planUpdater(setForm, active.loan_id, isLump(active) ? {} : { direction: 'early' })} res={preview.byLoan[active.loan_id]} pending={preview.pending} />
    </> : <section className="ob-plan-card">
      <h2>대출별 설정 현황</h2>
      <ul className="ob-overview">
        {loans.map(l => {
          const draft = draftOf(goal, l.loan_id)
          const res = preview.byLoan[l.loan_id]
          const done = Boolean(planPayload(l, { ...draft, direction: isLump(l) ? draft.direction : 'early' }))
          return <li key={l.loan_id}>
            <strong>{pillLabel(l)}</strong>
            <span>{done && res ? `${modeSummary(l, { ...draft, direction: isLump(l) ? draft.direction : 'early' })} · 완납 ${fmtYM(res.estimated_payoff_date)} · 월 ${fmtWon(res.monthly_amount)}` : '아직 정하지 않았어요'}</span>
            <button type="button" className="ob-link-btn" onClick={() => pick(l.loan_id)}>{done ? '수정' : '설정하기'}</button>
          </li>
        })}
      </ul>
    </section>}
  </>
}
