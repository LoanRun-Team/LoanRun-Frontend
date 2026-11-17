import { fmtWon } from '../format.js'
import { draftOf, fmtYM, isLump, modeSummary } from '../planModel.js'

// Figma: Footer(S-03) — 위쪽 가는 primary 선 + 선택 요약 3칸 + "이 계획으로 시작하기"
export default function PlanFooter({ form, preview, nav }) {
  const loans = form.loans
  const multi = loans.length > 1
  const results = loans.map(l => preview.byLoan[l.loan_id]).filter(Boolean)
  const single = loans[0]
  const lumpSingle = !multi && single && isLump(single)

  const mode = multi ? `대출별 설정 · ${loans.length}개` : modeSummary(single, draftOf(form.goal, single.loan_id))
  const payoff = results.map(r => r.estimated_payoff_date).sort().at(-1)
  const sum = key => results.reduce((s, r) => s + r[key], 0)
  const third = lumpSingle
    ? { label: '월 필요 상환액', value: results[0] ? fmtWon(results[0].monthly_amount) : '—' }
    : { label: multi ? '월 추가 상환액 합계' : '월 추가 상환액', value: results.length ? fmtWon(sum('extra_monthly_payment')) : '—' }
  const items = [{ label: '상환 성향', value: mode }, { label: '희망 완납일', value: fmtYM(payoff) }, third]

  const disabled = !nav.canNext || preview.pending || preview.status === 'error' || nav.busy
  return <footer className="ob-plan-footer">
    <div className="ob-plan-footer-inner">
      <dl>{items.map(i => <div key={i.label}><dt>{i.label}</dt><dd>{i.value}</dd></div>)}</dl>
      {nav.error && <p className="ob-error" role="alert">{nav.error}</p>}
      <button type="button" className="ob-button primary" onClick={nav.onNext} disabled={disabled}>{nav.busy ? '저장 중…' : '이 계획으로 시작하기'}</button>
    </div>
  </footer>
}
