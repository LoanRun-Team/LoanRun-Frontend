import minus from '../../../assets/onboarding/icon-minus.svg'
import plus from '../../../assets/onboarding/icon-plus.svg'
import info from '../../../assets/onboarding/icon-info.svg'
import { STEP, allocationSum, fmt, labelYM, loanName, payoffYM, won } from '../budgetModel.js'

// Figma: 여유자금 분할하기 — 대출별 추가 상환과 남겨두기를 나누고, 합계가 여유자금과 같을 때만 반영할 수 있다.
function AmountStepper({ label, value, onChange, disabled }) {
  const set = n => onChange(Math.max(0, n))
  return <div className="bd-alloc-row">
    <span>{label}</span>
    <div className="bd-stepper">
      <button type="button" aria-label={`${label} 줄이기`} onClick={() => set((value || 0) - STEP)} disabled={disabled || !value}><img src={minus} alt="" width="20" height="20" /></button>
      <label className="bd-stepper-input"><span className="bd-sr-only">{label} 금액</span>
        <input inputMode="numeric" value={fmt(value || 0)} disabled={disabled} onChange={e => set(Number(e.target.value.replace(/\D/g, '').slice(0, 12)) || 0)} /><small>원</small>
      </label>
      <button type="button" aria-label={`${label} 늘리기`} onClick={() => set((value || 0) + STEP)} disabled={disabled}><img src={plus} alt="" width="20" height="20" /></button>
    </div>
  </div>
}

export default function AllocationCard({ ym, available, loans, allocation, onChange, onReset, onApply }) {
  const sum = allocationSum(allocation)
  const diff = available - sum
  const disabled = available <= 0
  const setExtra = (id, v) => onChange({ ...allocation, applied: false, extras: { ...allocation.extras, [id]: v } })
  const withPlan = payoffYM(loans, allocation.extras)
  const without = payoffYM(loans, {})

  return <section className="bd-card" aria-labelledby="bd-alloc-title">
    <div><h2 id="bd-alloc-title">여유자금 분할하기</h2><p className="bd-alloc-total">{won(Math.max(available, 0))}</p></div>
    <div className="bd-alloc">
      {loans.map(l => <AmountStepper key={l.loan_id} label={`${loanName(l)} 추가 상환`} value={allocation.extras[l.loan_id]} disabled={disabled} onChange={v => setExtra(l.loan_id, v)} />)}
      <AmountStepper label="남겨두기" value={allocation.reserve} disabled={disabled} onChange={v => onChange({ ...allocation, applied: false, reserve: v })} />
      <div className="bd-alloc-row sum"><span>배분 합계</span><div><strong>{fmt(sum)} / {won(Math.max(available, 0))}</strong>{diff !== 0 && !disabled && <p className="bd-danger">{diff > 0 ? '남은' : '초과'} 금액 {won(Math.abs(diff))}</p>}</div></div>
    </div>
    {withPlan && <p className="bd-banner"><img src={info} alt="" width="20" height="20" /><span>{without > withPlan ? `반영하면 예상 완납일 ${labelYM(withPlan)} 유지, 반영하지 않으면 ${labelYM(without)}` : `예상 완납일은 ${labelYM(withPlan)}이에요`}</span></p>}
    <div className="bd-actions">
      <button type="button" className="bd-button outline" onClick={onReset} disabled={disabled}>처음으로</button>
      <button type="button" className="bd-button primary" onClick={onApply} disabled={disabled || diff !== 0}>{allocation.applied ? '반영 완료' : '반영하기'}</button>
    </div>
    <span className="bd-sr-only" aria-live="polite">{ym}</span>
  </section>
}
