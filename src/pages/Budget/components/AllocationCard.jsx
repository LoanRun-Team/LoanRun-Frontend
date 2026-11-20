import { useState } from 'react'
import minus from '../../../assets/onboarding/icon-minus.svg'
import plus from '../../../assets/onboarding/icon-plus.svg'
import info from '../../../assets/onboarding/icon-info.svg'
import { STEP, allocationSum, fmt, labelYM, loanName, payoffYM, won } from '../budgetModel.js'

// 이번 달 여유자금 배분. 대출별 추가 상환과 남겨두기를 나누고, 합계가 여유자금과 같을 때만 반영할 수 있다.
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

const SEGMENT_COLORS = ['#229eb0', '#72d6e6', '#486072', '#9aa6b2']
const LUMP_COLOR = '#f7c452'
const REST_COLOR = '#d5dae0'
const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']
const pct = (n, total) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0)

// 요약(기본): 배분 비율 막대와 대출별 금액. "배분하기"를 누르면 편집 화면으로 바뀐다.
function Summary({ available, loans, allocation, applied, disabled, onEdit }) {
  const total = Math.max(available, 0)
  const rows = loans.map((l, i) => ({
    key: l.loan_id, amount: allocation.extras[l.loan_id] || 0,
    label: `${CIRCLED[i] ?? i + 1} ${loanName(l)}${l.repayment_method === 'BULLET' ? ' 적립' : ''}`,
    color: l.repayment_method === 'BULLET' ? LUMP_COLOR : SEGMENT_COLORS[i % SEGMENT_COLORS.length],
  }))
  if (allocation.reserve > 0) rows.push({ key: 'reserve', amount: allocation.reserve, label: '남겨두기', color: SEGMENT_COLORS[3] })
  const rest = Math.max(total - rows.reduce((s, r) => s + r.amount, 0), 0)
  rows.push({ key: 'rest', amount: rest, label: '남는 금액', color: REST_COLOR })
  return <>
    <div className="bd-alloc-head">
      <h2 id="bd-alloc-title">이번달 여유자금 배분</h2>
      <button type="button" className="bd-button outline small" onClick={onEdit} disabled={disabled}>배분하기</button>
    </div>
    <div className="bd-bar" role="img" aria-label="여유자금 배분 비율">
      {rows.filter(r => r.amount > 0).map(r => <span key={r.key} style={{ flexGrow: r.amount, background: r.color }} />)}
    </div>
    <ul className="bd-legend">
      {rows.map(r => <li key={r.key}><i style={{ background: r.color }} /><span>{r.label}</span><strong>{won(r.amount)}</strong><em>{pct(r.amount, total)}%</em></li>)}
    </ul>
    {!applied && total > 0 && <p className="bd-sub">아직 반영 전이에요. 배분하기를 눌러 확인해 주세요</p>}
  </>
}

export default function AllocationCard({ ym, available, loans, allocation, applied, busy, onChange, onReset, onApply }) {
  const [editing, setEditing] = useState(false)
  const sum = allocationSum(allocation)
  const diff = available - sum
  const disabled = available <= 0
  const setExtra = (id, v) => onChange({ ...allocation, extras: { ...allocation.extras, [id]: v } })
  const withPlan = payoffYM(loans, allocation.extras)
  const without = payoffYM(loans, {})
  const back = () => { onReset(); setEditing(false) }
  async function apply() { if (await onApply()) setEditing(false) }

  if (!editing) return <section className="bd-card" aria-labelledby="bd-alloc-title">
    <Summary available={available} loans={loans} allocation={allocation} applied={applied} disabled={disabled} onEdit={() => setEditing(true)} />
    <span className="bd-sr-only" aria-live="polite">{ym}</span>
  </section>

  return <section className="bd-card" aria-labelledby="bd-alloc-title">
    <div><h2 id="bd-alloc-title">이번달 여유자금 배분</h2><p className="bd-alloc-total">{won(Math.max(available, 0))}</p></div>
    <div className="bd-alloc">
      {loans.map(l => <AmountStepper key={l.loan_id} label={`${loanName(l)} 추가 상환`} value={allocation.extras[l.loan_id]} disabled={disabled} onChange={v => setExtra(l.loan_id, v)} />)}
      <AmountStepper label="남겨두기" value={allocation.reserve} disabled={disabled} onChange={v => onChange({ ...allocation, reserve: v })} />
      <div className="bd-alloc-row sum"><span>배분 합계</span><div><strong>{fmt(sum)} / {won(Math.max(available, 0))}</strong>{diff < 0 && !disabled && <p className="bd-danger">초과 금액 {won(-diff)}</p>}{diff > 0 && !disabled && <p className="bd-sub">남은 금액 {won(diff)}은 다음 달로 이월돼요</p>}</div></div>
    </div>
    {withPlan && <p className="bd-banner"><img src={info} alt="" width="20" height="20" /><span>{without > withPlan ? `반영하면 예상 완납일 ${labelYM(withPlan)} 유지, 반영하지 않으면 ${labelYM(without)}` : `예상 완납일은 ${labelYM(withPlan)}이에요`}</span></p>}
    <div className="bd-actions">
      <button type="button" className="bd-button outline" onClick={back} disabled={busy}>처음으로</button>
      <button type="button" className="bd-button primary" onClick={apply} disabled={disabled || diff < 0 || busy || applied}>{busy ? '반영 중…' : applied ? '반영 완료' : '반영하기'}</button>
    </div>
    <span className="bd-sr-only" aria-live="polite">{ym}</span>
  </section>
}
