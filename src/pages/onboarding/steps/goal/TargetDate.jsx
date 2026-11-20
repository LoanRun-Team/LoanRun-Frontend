import LoanInfoCard from '../../components/LoanInfoCard.jsx'
import PlanEditor from '../../components/PlanEditor.jsx'
import { draftOf } from '../../planModel.js'
import { planUpdater } from './usePlanPreview.js'
import { useSavingsBalance } from './useSavingsBalance.js'

// 목표 완납일 설정. 만기일시 대출은 완납일(또는 월 적립액)을 정해야 계획이 만들어진다.
export default function TargetDate({ form, setForm, preview }) {
  const loan = form.loans[0]
  const draft = draftOf(form.goal, loan.loan_id)
  const onDraft = planUpdater(setForm, loan.loan_id)
  const savings = useSavingsBalance(setForm)
  return <>
    <LoanInfoCard key={loan.loan_id} loan={loan} onSavings={v => savings.change(loan, v)} busy={savings.busy} error={savings.error} />
    <PlanEditor loan={loan} draft={draft} onDraft={onDraft} res={preview.byLoan[loan.loan_id]} pending={preview.pending} />
  </>
}
