import { useState } from 'react'
import Dialog from './Dialog.jsx'
import MoneyField from './MoneyField.jsx'
import { incomeTotal, monthName, surplusOf, won, fmt } from '../budgetModel.js'

// 이번 달 금액 입력. 정기 소득, 추가 수령 기록, 비정기 소득 화면을 함께 쓴다.
// 소득 유형(정기·비정기)은 온보딩에서 정한 값을 따르고, 소득·지출·저축 금액은 이번 달 실제 값으로 고칠 수 있다.
const DAY_OPTIONS = (ym, lastDay) => Array.from({ length: lastDay }, (_, i) => ({ value: i + 1, label: `${monthName(ym)} ${i + 1}일` }))

function DayAmountRows({ ym, rows, lastDay, onChange, dayLabel, amountLabel }) {
  const set = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  return rows.map((row, i) => <div className="bd-row" key={i}>
    <div className="bd-field">
      <label htmlFor={`day-${i}`}>{i === 0 ? dayLabel : <span className="bd-sr-only">{dayLabel}</span>}</label>
      <select id={`day-${i}`} value={row.day} onChange={e => set(i, { day: Number(e.target.value) })}>{DAY_OPTIONS(ym, lastDay).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    </div>
    <MoneyField label={amountLabel} hideLabel={i > 0} value={row.amount} onChange={v => set(i, { amount: v })} />
  </div>)
}

// lastDay: 고를 수 있는 마지막 날(이번 달이면 오늘, 아니면 말일). onSave 는 Promise 를 돌려주고, 실패하면 오류 문구를 모달 안에 보여준다.
export default function AmountDialog({ ym, initial, repayment, lastDay, onSave, onClose }) {
  const [m, setM] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function submit() {
    setSaving(true)
    setError('')
    try { await onSave(m) } catch (e) { setError(e?.message || '저장하지 못했어요. 잠시 후 다시 시도해 주세요.') } finally { setSaving(false) }
  }
  const regular = m.income_type === 'REGULAR'
  const patch = p => setM(prev => ({ ...prev, ...p }))
  const surplus = surplusOf(m, repayment)
  const fieldsFilled = [m.fixed, m.variable, m.discretionary, m.savings].every(v => v != null)
  // 추가 수령·비정기 입금은 1원 이상이어야 한다(서버 규칙). 비정기는 입금이 한 건 이상 있어야 한다.
  const rows = regular ? m.extras : m.receipts
  const incomeOk = rows.every(r => r.amount >= 1) && (regular || rows.length > 0)
  const canSave = fieldsFilled && incomeOk && surplus >= 0
  const newRow = () => ({ day: lastDay, amount: null })

  return <Dialog title="이번 달 금액 입력" onClose={onClose}>
    <div className="bd-inset">
      <div className="bd-inset-head"><span>소득</span><span className={`bd-badge${regular ? ' brand' : ''}`}>{regular ? '정기 소득 · 자동 반영' : '비정기 소득'}</span></div>
      {regular ? <>
        <div className="bd-inset-line"><span>월 실수령액(자동 반영)</span>{m.extras.length === 0 ? <strong className="big">{won(m.base_income || 0)}</strong> : <span>{won(m.base_income || 0)}</span>}</div>
        <DayAmountRows ym={ym} rows={m.extras} lastDay={lastDay} dayLabel="받은 날" amountLabel="추가 수령 금액" onChange={extras => patch({ extras })} />
        <button type="button" className="bd-button outline small" onClick={() => patch({ extras: [...m.extras, newRow()] })}>+ 추가 수령 기록</button>
        {m.extras.length > 0 && <div className="bd-inset-total"><span>이번 달 소득</span><strong className="big">{won(incomeTotal(m))}</strong></div>}
      </> : <>
        <div className="bd-inset-line"><span>이번 달 받은 금액(자동 합계)</span><strong className="big">{won(incomeTotal(m))}</strong></div>
        <DayAmountRows ym={ym} rows={m.receipts} lastDay={lastDay} dayLabel="입금일" amountLabel="금액" onChange={receipts => patch({ receipts })} />
        <button type="button" className="bd-button outline small" onClick={() => patch({ receipts: [...m.receipts, newRow()] })}>+ 입금 추가</button>
      </>}
    </div>
    <div className="bd-grid">
      <MoneyField label="고정 필수 지출(월세·보험료·통신비)" value={m.fixed} onChange={v => patch({ fixed: v })} />
      <MoneyField label="변동 필수 지출(식비·교통비·생필품)" value={m.variable} onChange={v => patch({ variable: v })} />
      <MoneyField label="선택 지출" value={m.discretionary} onChange={v => patch({ discretionary: v })} />
      <MoneyField label="저축" value={m.savings} onChange={v => patch({ savings: v })} />
    </div>
    <div className="bd-inset">
      <div className="bd-inset-line"><span>정기 상환</span><span>{won(repayment)}</span></div>
      <div className="bd-inset-line"><strong>여유자금(자동 계산)</strong><strong className={`big${surplus < 0 ? ' danger' : ''}`}>{surplus < 0 ? '−' : ''}{fmt(Math.abs(surplus))}원</strong></div>
      {surplus < 0 && <p className="bd-danger" role="alert">지출·저축·상환이 소득보다 {won(-surplus)} 많아요. 금액을 다시 확인해 주세요.</p>}
    </div>
    {error && <p className="bd-danger" role="alert">{error}</p>}
    <footer>
      <button type="button" className="bd-button outline" onClick={onClose} disabled={saving}>취소</button>
      <button type="button" className="bd-button primary" disabled={!canSave || saving} onClick={submit}>{saving ? '저장 중…' : '저장하기'}</button>
    </footer>
  </Dialog>
}
