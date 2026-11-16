import StepCard from '../../components/StepCard.jsx'
import SelectCard from '../../components/SelectCard.jsx'
import { initialForm, loanFormOptions } from '../../data.js'

// Figma: S-01a 대출 형태 (loan_form: GENERAL | CREDIT_LINE)
export default function LoanType({ form, setForm }) {
  // 대출 형태가 바뀌면 상품 목록이 달라지므로 S-01b 선택을 초기화한다.
  const select = loan_form => setForm(f => f.loan.loan_form === loan_form ? f : ({
    ...f,
    loan: { ...initialForm.loan, loan_form },
    selection: initialForm.selection,
  }))
  return <StepCard>
    <div className="ob-options" role="radiogroup" aria-label="대출 형태">
      {loanFormOptions.map(o => <SelectCard key={o.value} name="loan-form" label={o.label} icon={o.icon} selected={form.loan.loan_form === o.value} onSelect={() => select(o.value)} />)}
    </div>
  </StepCard>
}
