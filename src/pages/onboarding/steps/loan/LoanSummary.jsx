import { useState } from 'react'
import plus from '../../../../assets/onboarding/icon-plus.svg'
import { onboardingApi } from '../../../../api/index.js'
import { loanTypeLabels, initialForm } from '../../data.js'
import { diffMonths, fmtNumber } from '../../format.js'

// Figma: S-01d 대출 요약 — 등록한 대출 목록(수정 / 삭제) + 대출 추가
const ym = iso => `${Number(iso.slice(0, 4))}년 ${Number(iso.slice(5, 7))}월`
const rateWord = { FIXED: '고정', VARIABLE: '변동' }

function describe(l) {
  const rate = `${rateWord[l.rate_type]} ${l.annual_rate}%`
  const tail = `매월 ${l.payment_day}일 · 만기 ${ym(l.maturity_date)}`
  if (l.loan_form === 'CREDIT_LINE') return `한도 ${fmtNumber(l.credit_limit)}원 · 사용 ${fmtNumber(l.used_amount)}원 · ${rate} · 이자만 월 ${fmtNumber(l.estimated_monthly_payment)}원 · ${tail}`
  return `잔액 ${fmtNumber(l.remaining_principal)}원 · ${rate} · 월 ${fmtNumber(l.estimated_monthly_payment)}원 · ${tail}`
}

// 등록된 대출을 S-01c 입력 상태로 되돌린다. "다음"을 누를 때 기존 대출을 지우고 새로 등록한다.
function toDraft(l) {
  const months = diffMonths(l.start_date, l.maturity_date)
  return {
    loan: {
      loan_form: l.loan_form, loan_type: l.loan_type, product_id: l.product_id, institution_name: l.institution_name, product_name: l.product_name,
      repayment_method: l.repayment_method, original_principal: l.original_principal, remaining_principal: l.remaining_principal,
      annual_rate: l.annual_rate, rate_type: l.rate_type, rate_reset_months: l.rate_reset_months,
      start_date: l.start_date, maturity_date: l.maturity_date, payment_day: l.payment_day,
      grace_months: l.grace_months > 0 ? l.grace_months : null, post_grace_method: l.post_grace_method,
      credit_limit: l.credit_limit, used_amount: l.used_amount,
    },
    selection: { ...initialForm.selection, manual: l.product_id == null, loan_type_label: loanTypeLabels[l.loan_type] ?? null, term: { years: Math.floor(months / 12), months: months % 12 }, editingLoanId: l.loan_id },
  }
}

export default function LoanSummary({ form, setForm, jump }) {
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const loans = form.loans.toReversed()

  async function remove(loan) {
    if (!window.confirm(`${loan.product_name || loanTypeLabels[loan.loan_type]} 대출을 삭제할까요?`)) return
    setBusyId(loan.loan_id)
    setError('')
    try {
      await onboardingApi.deleteLoan(loan.loan_id)
      setForm(f => ({ ...f, loans: f.loans.filter(l => l.loan_id !== loan.loan_id) }))
    } catch (e) {
      setError(e?.message || '삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setBusyId(null)
    }
  }
  function edit(loan) {
    setForm(f => ({ ...f, ...toDraft(loan) }))
    jump('repayment-info')
  }

  return <section className="ob-registered" aria-labelledby="ob-registered-title">
    <h2 id="ob-registered-title">등록한 대출 {loans.length}개</h2>
    <ul>
      {loans.map(l => <li key={l.loan_id} className="ob-loan-row">
        <strong>{loanTypeLabels[l.loan_type] ?? l.loan_type}</strong>
        <span className="ob-loan-detail">{describe(l)}</span>
        <button type="button" className="ob-link-btn" onClick={() => edit(l)} disabled={busyId === l.loan_id}>수정</button>
        <button type="button" className="ob-danger-btn" onClick={() => remove(l)} disabled={busyId === l.loan_id}>삭제</button>
      </li>)}
    </ul>
    {error && <p className="ob-error" role="alert">{error}</p>}
    <button type="button" className="ob-add-loan" onClick={() => jump('loan-type')}><img src={plus} alt="" width="20" height="20" />대출 추가</button>
  </section>
}
