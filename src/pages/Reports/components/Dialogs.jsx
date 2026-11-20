import { useEffect, useRef, useState } from 'react'
import { won } from '../../Budget/budgetModel.js'
import { reportApi } from '../../../api/index.js'
import { AGE_GROUPS, DECILES, previewRows } from '../reportModel.js'

// 공용 모달: Esc 로 닫고, 열릴 때 첫 버튼에 초점을 둔다. 배경을 누르면 닫힌다.
function Dialog({ title, onClose, wide, children }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.querySelector('button:not(.rp-close)')?.focus()
    const onKey = event => { if (event.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return <div className="rp-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose?.() }}>
    <div className={`rp-dialog${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="rp-dialog-title" ref={ref}>
      <div className="rp-dialog-head">
        <h2 id="rp-dialog-title">{title}</h2>
        {onClose && <button type="button" className="rp-close" aria-label="닫기" onClick={onClose}>×</button>}
      </div>
      {children}
    </div>
  </div>
}

// 전략 반영 확인창. 변경 전·후 표를 보여 주고 "반영하기"를 누르면 PUT 한다.
export function ConfirmDialog({ candidate, preview, loans, currentCode, busy, error, onCancel, onConfirm }) {
  const rows = previewRows(preview, loans, currentCode).filter(r => r.key !== 'interest')
  const ordered = [...rows.filter(r => r.key !== 'payoff'), ...rows.filter(r => r.key === 'payoff')]
  const before = preview.current_plans.reduce((s, p) => s + p.extra_monthly_payment, 0)
  const after = preview.proposed_plans.reduce((s, p) => s + p.extra_monthly_payment, 0)
  return <Dialog title="이 전략으로 계획을 바꿀까요?" onClose={busy ? undefined : onCancel} wide>
    <p className="rp-dialog-text">{candidate.label} 전략을 상환 계획에 반영해요. {before === after ? `월 추가 상환 합계 ${won(after)}은 그대로예요.` : `월 추가 상환 합계가 ${won(before)}에서 ${won(after)}으로 바뀌어요.`}</p>
    <table className="rp-table">
      <thead><tr><th scope="col">항목</th><th scope="col">변경 전</th><th scope="col" className="after">변경 후</th></tr></thead>
      <tbody>{ordered.map(row => <tr key={row.key}><th scope="row">{row.label}</th><td>{row.before}</td><td className="after"><b>{row.after}</b></td></tr>)}</tbody>
    </table>
    {error && <p className="rp-banner danger" role="alert"><span>{error.message || '계획에 반영하지 못했어요.'}</span></p>}
    <div className="rp-dialog-actions">
      <button type="button" className="rp-button outline" onClick={onCancel} disabled={busy}>취소</button>
      <button type="button" className="rp-button primary-s" onClick={onConfirm} disabled={busy}>반영하기</button>
    </div>
  </Dialog>
}

// 미리보기 뒤에 정보가 바뀌어 409 STRATEGY_STALE 가 오면 최신 정보로 다시 계산하게 한다.
export function RecalcDialog({ onRecalc, onClose }) {
  return <Dialog title="정보가 변경되어 다시 확인이 필요해요" onClose={onClose}>
    <p className="rp-dialog-text">미리보기 이후 대출·재정 정보가 바뀌었어요. 최신 정보로 다시 계산한 뒤 반영할 수 있어요.</p>
    <div className="rp-dialog-actions"><button type="button" className="rp-button primary-s" onClick={onRecalc}>최신 정보로 다시 계산</button></div>
  </Dialog>
}

// 비교 기준 변경. 연령대·소득 분위를 고르고 적용하면 PATCH 한 뒤 리포트를 다시 만든다(비교 기준이 바뀌면 stale).
export function CompareDialog({ onClose, onSaved }) {
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    reportApi.getComparisonSettings({ signal: controller.signal }).then(
      data => setForm({ age_group: data.age_group, income_decile: data.income_decile }),
      err => { if (!controller.signal.aborted) setError(err) },
    )
    return () => controller.abort()
  }, [])
  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await reportApi.updateComparisonSettings({ consented: true, age_group: form.age_group, income_decile: form.income_decile })
      onSaved()
    } catch (err) { setError(err); setBusy(false) }
  }
  return <Dialog title="비교 기준 변경" onClose={busy ? undefined : onClose}>
    {!form && !error && <p className="rp-loading" role="status">불러오는 중…</p>}
    {form && <>
      <div><p className="rp-field-label">연령대</p>
        <div className="rp-age-grid" role="group" aria-label="연령대">
          {AGE_GROUPS.map(a => <button key={a.code} type="button" className={`rp-choice${form.age_group === a.code ? ' on' : ''}`} aria-pressed={form.age_group === a.code} onClick={() => setForm(f => ({ ...f, age_group: a.code }))}>{a.label}</button>)}
        </div>
      </div>
      <div><p className="rp-field-label">소득 분위</p>
        <div className="rp-age-grid" role="group" aria-label="소득 분위">
          {DECILES.map(d => <button key={d} type="button" className={`rp-choice${form.income_decile === d ? ' on' : ''}`} aria-pressed={form.income_decile === d} onClick={() => setForm(f => ({ ...f, income_decile: d }))}>{d}분위</button>)}
        </div>
      </div>
      <p className="rp-dialog-text">또래 비교는 예시 데이터를 기준으로 해요.</p>
    </>}
    {error && <p className="rp-banner danger" role="alert"><span>{error.message || '비교 기준을 저장하지 못했어요.'}</span></p>}
    <div className="rp-dialog-actions">
      <button type="button" className="rp-button outline" onClick={onClose} disabled={busy}>취소</button>
      <button type="button" className="rp-button primary-s" onClick={submit} disabled={busy || !form}>적용하기</button>
    </div>
  </Dialog>
}

// PRO 가 아니면(403 PRO_REQUIRED) 리포트 위에 안내를 띄운다. 결제 화면은 아직 없어서 "시작하기"는 안내만 한다.
export function LockedDialog({ onStart, onLater }) {
  return <Dialog title="상환 리포트는 PRO에서 볼 수 있어요" onClose={onLater}>
    <p className="rp-dialog-text">내 상환 속도와 완납 가능성, 나에게 맞는 상환 전략을 한 번에 확인해 보세요.</p>
    <div className="rp-dialog-actions">
      <button type="button" className="rp-button outline" onClick={onLater}>나중에</button>
      <button type="button" className="rp-button primary-s" onClick={onStart}>PRO 시작하기</button>
    </div>
  </Dialog>
}
