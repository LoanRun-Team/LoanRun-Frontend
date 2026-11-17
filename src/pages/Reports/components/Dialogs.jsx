import { useEffect, useRef } from 'react'
import { won } from '../../Budget/budgetModel.js'
import { previewRows } from '../reportModel.js'

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

// Figma F4-a: 이 전략으로 계획을 바꿀까요? 변경 전·후 표를 보여 주고 "반영하기"로 PUT 한다.
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

// Figma F4-a-c: 미리보기 뒤에 정보가 바뀌어 409 STRATEGY_STALE 가 오면, 최신 정보로 다시 계산하게 한다.
export function RecalcDialog({ onRecalc, onClose }) {
  return <Dialog title="정보가 변경되어 다시 확인이 필요해요" onClose={onClose}>
    <p className="rp-dialog-text">미리보기 이후 대출·재정 정보가 바뀌었어요. 최신 정보로 다시 계산한 뒤 반영할 수 있어요.</p>
    <div className="rp-dialog-actions"><button type="button" className="rp-button primary-s" onClick={onRecalc}>최신 정보로 다시 계산</button></div>
  </Dialog>
}
