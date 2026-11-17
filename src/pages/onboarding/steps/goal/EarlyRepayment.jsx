import LoanContext from '../../components/LoanContext.jsx'
import PlanEditor from '../../components/PlanEditor.jsx'
import { draftOf } from '../../planModel.js'
import { planUpdater } from './usePlanPreview.js'
import { useSurplus } from './useSurplus.js'

// Figma: S-03b 조기 상환 설정 (상환 성향 / 완납일 기준 / 추가 상환액 기준)
export default function EarlyRepayment({ form, setForm, preview }) {
  const loan = form.loans[0]
  const surplus = useSurplus()
  const draft = { ...draftOf(form.goal, loan.loan_id), direction: 'early' }
  const onDraft = planUpdater(setForm, loan.loan_id, { direction: 'early' })
  return <>
    <LoanContext loan={loan} />
    <PlanEditor loan={loan} draft={draft} onDraft={onDraft} res={preview.byLoan[loan.loan_id]} pending={preview.pending} surplus={surplus} />
  </>
}
