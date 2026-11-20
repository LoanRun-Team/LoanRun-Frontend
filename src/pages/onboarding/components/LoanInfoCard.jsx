import { useState } from 'react'
import NumberField from './NumberField.jsx'
import { methodLabel } from '../data.js'
import { fmtNumber } from '../format.js'
import { fmtYM, loanChipLabel } from '../planModel.js'

// 만기일시 대출 정보 카드. 상환 방식, 남은 원금, 금리, 만기, 매월 내는 이자와 현재까지 마련한 상환자금(선택)을 보여 준다.
// 마련한 상환자금은 대출 등록 때만 받는 값(initial_savings_balance)이라, 입력을 마치면(onSavings) 대출을 다시 등록해 반영한다.
export default function LoanInfoCard({ loan, onSavings, busy, error }) {
  const [text, setText] = useState(loan.initial_savings_balance || null)
  const rows = [
    ['상환 방식', methodLabel(loan.repayment_method)],
    ['남은 원금', `${fmtNumber(loan.remaining_principal)}원`],
    ['금리', `연 ${Number(loan.annual_rate).toFixed(1)}%`],
    ['만기', fmtYM(loan.maturity_date)],
    ['매월 내는 이자', `${fmtNumber(loan.estimated_monthly_payment)}원`],
  ]
  return <section className="ob-loan-card" aria-label="대출 정보">
    <h2>{loanChipLabel(loan)}</h2>
    <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    <NumberField label="현재까지 마련한 상환자금 (선택)" value={text} unit="원" disabled={busy} helper="적립 속도 계산에는 포함되지 않아요"
      onChange={setText} onCommit={v => { if ((v ?? 0) !== (loan.initial_savings_balance ?? 0)) onSavings(v ?? 0) }} />
    {error && <p className="ob-error" role="alert">{error}</p>}
  </section>
}
