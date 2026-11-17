import LoanContext from '../../components/LoanContext.jsx'
import PlanEditor from '../../components/PlanEditor.jsx'
import { draftOf } from '../../planModel.js'
import { planUpdater } from './usePlanPreview.js'

// Figma: S-03c 목표 완납일 설정 — 만기일시·한도 대출은 완납일을 정해야 계획이 만들어진다(필수)
export default function TargetDate({ form, setForm, preview }) {
  const loan = form.loans[0]
  const draft = draftOf(form.goal, loan.loan_id)
  const onDraft = planUpdater(setForm, loan.loan_id)
  return <>
    <p className="ob-required-row"><strong>목표 완납일 설정</strong><span className="ob-tag warn">필수</span><span>일시상환형은 완납일을 정해야 계획이 만들어져요</span></p>
    <LoanContext loan={loan} />
    <PlanEditor loan={loan} draft={draft} onDraft={onDraft} res={preview.byLoan[loan.loan_id]} pending={preview.pending} />
  </>
}
